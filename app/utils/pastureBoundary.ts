import area from "@turf/area"
import centroid from "@turf/centroid"
import type { Feature, GeoJsonProperties, Geometry, MultiPolygon, Polygon, Position } from "geojson"

export type PastureBoundaryGeometry = Polygon | MultiPolygon
export type PastureBoundaryFeature = Feature<PastureBoundaryGeometry, GeoJsonProperties>

export interface BoundaryCoordinate {
  latitude: number
  longitude: number
}

export interface BoundaryPolygonShape {
  coordinates: BoundaryCoordinate[]
  holes: BoundaryCoordinate[][]
}

export interface BoundaryMetrics {
  areaHectares: number
  centroidLatitude: number
  centroidLongitude: number
}

export const SOUTH_AFRICA_REGION = {
  latitude: -30.5595,
  longitude: 22.9375,
  latitudeDelta: 13,
  longitudeDelta: 16,
}

function isFinitePosition(position: Position): boolean {
  return (
    position.length >= 2 &&
    Number.isFinite(position[0]) &&
    Number.isFinite(position[1]) &&
    position[0] >= -180 &&
    position[0] <= 180 &&
    position[1] >= -90 &&
    position[1] <= 90
  )
}

function positionsMatch(a: Position, b: Position): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

function closeRing(positions: Position[]): Position[] {
  if (positions.length === 0) return positions
  if (positionsMatch(positions[0], positions[positions.length - 1])) return positions
  return [...positions, [...positions[0]]]
}

function isValidRing(positions: Position[]): boolean {
  return positions.length >= 4 && positions.every(isFinitePosition)
}

export function isPastureBoundaryFeature(
  feature: Feature<Geometry | null>,
): feature is PastureBoundaryFeature {
  if (!feature.geometry) return false
  if (feature.geometry.type === "Polygon") {
    return (
      feature.geometry.coordinates.length > 0 && feature.geometry.coordinates.every(isValidRing)
    )
  }
  if (feature.geometry.type === "MultiPolygon") {
    return (
      feature.geometry.coordinates.length > 0 &&
      feature.geometry.coordinates.every(
        (polygon) => polygon.length > 0 && polygon.every(isValidRing),
      )
    )
  }
  return false
}

export function createBoundaryFeature(
  coordinates: BoundaryCoordinate[],
  properties: GeoJsonProperties = {},
): PastureBoundaryFeature {
  const positions = coordinates.map<Position>((coordinate) => [
    coordinate.longitude,
    coordinate.latitude,
  ])

  if (positions.length < 3 || positions.some((position) => !isFinitePosition(position))) {
    throw new Error("A pasture boundary needs at least three valid points.")
  }

  return {
    type: "Feature",
    properties,
    geometry: {
      type: "Polygon",
      coordinates: [closeRing(positions)],
    },
  }
}

export function parseBoundaryFeature(
  value: string | null | undefined,
): PastureBoundaryFeature | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Feature<Geometry | null>
    return isPastureBoundaryFeature(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function boundaryToMapShapes(feature: PastureBoundaryFeature): BoundaryPolygonShape[] {
  const polygons =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates

  return polygons.map((polygon) => ({
    coordinates: polygon[0].map(([longitude, latitude]) => ({ latitude, longitude })),
    holes: polygon
      .slice(1)
      .map((ring) => ring.map(([longitude, latitude]) => ({ latitude, longitude }))),
  }))
}

export function boundaryToEditableCoordinates(
  feature: PastureBoundaryFeature,
): BoundaryCoordinate[] {
  const firstRing =
    feature.geometry.type === "Polygon"
      ? feature.geometry.coordinates[0]
      : feature.geometry.coordinates[0][0]

  const withoutClosingPoint =
    firstRing.length > 1 && positionsMatch(firstRing[0], firstRing[firstRing.length - 1])
      ? firstRing.slice(0, -1)
      : firstRing

  return withoutClosingPoint.map(([longitude, latitude]) => ({ latitude, longitude }))
}

export function getBoundaryMetrics(feature: PastureBoundaryFeature): BoundaryMetrics {
  const center = centroid(feature).geometry.coordinates
  return {
    areaHectares: area(feature) / 10_000,
    centroidLongitude: center[0],
    centroidLatitude: center[1],
  }
}

export function getBoundaryCoordinates(feature: PastureBoundaryFeature): BoundaryCoordinate[] {
  return boundaryToMapShapes(feature).flatMap((shape) => shape.coordinates)
}

export function getBoundaryRegion(feature: PastureBoundaryFeature) {
  const coordinates = getBoundaryCoordinates(feature)
  if (coordinates.length === 0) return SOUTH_AFRICA_REGION

  const latitudes = coordinates.map((coordinate) => coordinate.latitude)
  const longitudes = coordinates.map((coordinate) => coordinate.longitude)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.35, 0.003),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.35, 0.003),
  }
}

export function formatBoundaryArea(areaHectares: number): string {
  if (areaHectares < 1) return `${areaHectares.toFixed(2)} ha`
  if (areaHectares < 100) return `${areaHectares.toFixed(1)} ha`
  return `${Math.round(areaHectares)} ha`
}
