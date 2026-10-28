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

export interface ExistingPastureForBoundaryImport {
  id: string
  name: string
  code: string
}

export interface PastureBoundaryImportPlanItem {
  key: string
  candidate: BoundaryImportCandidate
  pastureName: string
  pastureCode: string
  existingPastureId: string | null
  action: "create" | "update"
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

function combinePolygonFeatures(
  features: PastureBoundaryFeature[],
  properties: GeoJsonProperties,
): PastureBoundaryFeature | null {
  const polygons = features.flatMap((feature) =>
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates,
  )
  if (polygons.length === 0) return null

  const feature: PastureBoundaryFeature = {
    type: "Feature",
    properties,
    geometry:
      polygons.length === 1
        ? { type: "Polygon", coordinates: polygons[0] }
        : { type: "MultiPolygon", coordinates: polygons },
  }
  return isPastureBoundaryFeature(feature) ? feature : null
}

function mergeCandidatesWithMatchingNames(
  candidates: BoundaryImportCandidate[],
): BoundaryImportCandidate[] {
  const grouped = new Map<string, BoundaryImportCandidate[]>()

  candidates.forEach((candidate) => {
    const key = candidate.name.trim().toLocaleLowerCase()
    grouped.set(key, [...(grouped.get(key) ?? []), candidate])
  })

  return [...grouped.values()].flatMap((matchingCandidates) => {
    const first = matchingCandidates[0]
    const combined = combinePolygonFeatures(
      matchingCandidates.map((candidate) => candidate.feature),
      { ...first.feature.properties, name: first.name },
    )
    if (!combined) return []
    return [
      {
        feature: combined,
        name: first.name,
        areaHectares: getBoundaryMetrics(combined).areaHectares,
      },
    ]
  })
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

    const polygonFeature = combinePolygonFeatures(
      polygonFeaturesFromGeometry(feature.geometry, properties),
      properties,
    )
    return polygonFeature
      ? [
          {
            feature: polygonFeature,
            name,
            areaHectares: getBoundaryMetrics(polygonFeature).areaHectares,
          },
        ]
      : []
  })

  if (candidates.length === 0) {
    throw new Error("No polygon boundaries were found in this KML/KMZ file.")
  }

  return mergeCandidatesWithMatchingNames(candidates).sort(
    (a, b) => b.areaHectares - a.areaHectares,
  )
}

export function generatePastureCode(name: string, reservedCodes: Iterable<string> = []): string {
  const words = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .match(/[A-Z0-9]+/g) ?? ["PASTURE"]

  let base =
    words.length === 1
      ? words[0].slice(0, 3)
      : words.length === 2
        ? `${words[0].slice(0, 2)}${words[1].slice(0, 2)}`
        : words
            .slice(0, 4)
            .map((word) => word[0])
            .join("")

  if (base.length < 2) base = `${base}P`.slice(0, 2)

  const reserved = new Set([...reservedCodes].map((code) => code.trim().toLocaleUpperCase()))
  let code = base
  let suffix = 2
  while (reserved.has(code)) {
    code = `${base}${suffix}`
    suffix += 1
  }
  return code
}

export function buildPastureBoundaryImportPlan(
  candidates: BoundaryImportCandidate[],
  existingPastures: ExistingPastureForBoundaryImport[],
): PastureBoundaryImportPlanItem[] {
  const existingByName = new Map(
    existingPastures.map((pasture) => [pasture.name.trim().toLocaleLowerCase(), pasture]),
  )
  const reservedCodes = new Set(existingPastures.map((pasture) => pasture.code))

  return candidates.map((candidate, index) => {
    const existing = existingByName.get(candidate.name.trim().toLocaleLowerCase())
    const pastureCode = existing?.code || generatePastureCode(candidate.name, reservedCodes)
    reservedCodes.add(pastureCode)

    return {
      key: `${candidate.name.trim().toLocaleLowerCase()}-${index}`,
      candidate,
      pastureName: candidate.name,
      pastureCode,
      existingPastureId: existing?.id ?? null,
      action: existing ? "update" : "create",
    }
  })
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
