import type { DocumentPickerAsset } from "expo-document-picker"
import { File as ExpoFile } from "expo-file-system"
import { kml } from "@tmcw/togeojson"
import { DOMParser } from "@xmldom/xmldom"
import type {
  GeoJsonProperties,
  Geometry,
  GeometryCollection,
  MultiPolygon,
  Polygon,
} from "geojson"
import JSZip from "jszip"

import {
  getBoundaryMetrics,
  isPastureBoundaryFeature,
  PastureBoundaryFeature,
} from "./pastureBoundary"

export interface BoundaryImportCandidate {
  feature: PastureBoundaryFeature
  name: string
  areaHectares: number
}

const MAX_BOUNDARY_FILE_SIZE = 20 * 1024 * 1024

function polygonFeaturesFromGeometry(
  geometry: Geometry | null,
  properties: GeoJsonProperties,
): PastureBoundaryFeature[] {
  if (!geometry) return []

  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    const feature = {
      type: "Feature" as const,
      properties,
      geometry: geometry as Polygon | MultiPolygon,
    }
    return isPastureBoundaryFeature(feature) ? [feature] : []
  }

  if (geometry.type === "GeometryCollection") {
    return (geometry as GeometryCollection).geometries.flatMap((child) =>
      polygonFeaturesFromGeometry(child, properties),
    )
  }

  return []
}

export function boundaryCandidatesFromKml(kmlText: string): BoundaryImportCandidate[] {
  const document = new DOMParser().parseFromString(kmlText.trimStart(), "text/xml")
  const parseErrors = document.getElementsByTagName("parsererror")
  if (parseErrors.length > 0) throw new Error("The selected file is not valid KML.")

  const collection = kml(document)
  const candidates = collection.features.flatMap((feature, featureIndex) => {
    const properties = feature.properties ?? {}
    const name =
      typeof properties.name === "string" && properties.name.trim()
        ? properties.name.trim()
        : `Boundary ${featureIndex + 1}`

    return polygonFeaturesFromGeometry(feature.geometry, properties).map(
      (polygonFeature, polygonIndex) => {
        const suffix = polygonIndex > 0 ? ` ${polygonIndex + 1}` : ""
        return {
          feature: polygonFeature,
          name: `${name}${suffix}`,
          areaHectares: getBoundaryMetrics(polygonFeature).areaHectares,
        }
      },
    )
  })

  if (candidates.length === 0) {
    throw new Error("No polygon boundaries were found in this KML/KMZ file.")
  }

  return candidates.sort((a, b) => b.areaHectares - a.areaHectares)
}

async function getAssetBytes(asset: DocumentPickerAsset): Promise<Uint8Array> {
  if (asset.file) {
    return new Uint8Array(await asset.file.arrayBuffer())
  }
  return new ExpoFile(asset.uri).bytes()
}

async function getAssetText(asset: DocumentPickerAsset): Promise<string> {
  if (asset.file) return asset.file.text()
  return new ExpoFile(asset.uri).text()
}

export async function importPastureBoundaryFile(
  asset: DocumentPickerAsset,
): Promise<{ candidates: BoundaryImportCandidate[]; source: "kml" | "kmz" }> {
  if (asset.size && asset.size > MAX_BOUNDARY_FILE_SIZE) {
    throw new Error("Boundary files must be smaller than 20 MB.")
  }

  const fileName = asset.name.toLowerCase()
  const isKmz =
    fileName.endsWith(".kmz") ||
    asset.mimeType === "application/vnd.google-earth.kmz" ||
    asset.mimeType === "application/zip"

  if (isKmz) {
    const archive = await JSZip.loadAsync(await getAssetBytes(asset))
    const kmlEntry = Object.values(archive.files).find(
      (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".kml"),
    )
    if (!kmlEntry) throw new Error("This KMZ archive does not contain a KML boundary file.")

    return {
      candidates: boundaryCandidatesFromKml(await kmlEntry.async("string")),
      source: "kmz",
    }
  }

  if (!fileName.endsWith(".kml") && asset.mimeType !== "application/vnd.google-earth.kml+xml") {
    throw new Error("Choose a .kml or .kmz boundary file.")
  }

  return {
    candidates: boundaryCandidatesFromKml(await getAssetText(asset)),
    source: "kml",
  }
}
