import {
  boundaryToEditableCoordinates,
  boundaryToMapShapes,
  createBoundaryFeature,
  formatBoundaryArea,
  getBoundaryMetrics,
  parseBoundaryFeature,
} from "@/utils/pastureBoundary"
import { boundaryCandidatesFromKml } from "@/utils/pastureBoundaryImport"

describe("pasture boundary geometry", () => {
  const coordinates = [
    { latitude: -29.001, longitude: 24.001 },
    { latitude: -29.001, longitude: 24.011 },
    { latitude: -29.011, longitude: 24.011 },
    { latitude: -29.011, longitude: 24.001 },
  ]

  it("closes a drawn polygon and preserves editable points", () => {
    const feature = createBoundaryFeature(coordinates, { name: "North camp" })
    const ring = feature.geometry.type === "Polygon"
      ? feature.geometry.coordinates[0]
      : []

    expect(ring).toHaveLength(5)
    expect(ring[0]).toEqual(ring[ring.length - 1])
    expect(boundaryToEditableCoordinates(feature)).toEqual(coordinates)
  })

  it("calculates an area, centroid, and map shape", () => {
    const feature = createBoundaryFeature(coordinates)
    const metrics = getBoundaryMetrics(feature)
    const shapes = boundaryToMapShapes(feature)

    expect(metrics.areaHectares).toBeGreaterThan(100)
    expect(metrics.centroidLatitude).toBeCloseTo(-29.006, 3)
    expect(metrics.centroidLongitude).toBeCloseTo(24.006, 3)
    expect(shapes).toHaveLength(1)
    expect(shapes[0].coordinates).toHaveLength(5)
    expect(formatBoundaryArea(metrics.areaHectares)).toMatch(/ha$/)
  })

  it("rejects invalid stored GeoJSON", () => {
    expect(parseBoundaryFeature("not-json")).toBeNull()
    expect(
      parseBoundaryFeature(
        JSON.stringify({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [24, -29] },
        }),
      ),
    ).toBeNull()
  })
})

describe("KML pasture boundary import", () => {
  it("extracts and sorts polygon placemarks by area", () => {
    const candidates = boundaryCandidatesFromKml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <Placemark>
            <name>Small camp</name>
            <Polygon><outerBoundaryIs><LinearRing><coordinates>
              24.000,-29.000,0 24.002,-29.000,0 24.002,-29.002,0
              24.000,-29.002,0 24.000,-29.000,0
            </coordinates></LinearRing></outerBoundaryIs></Polygon>
          </Placemark>
          <Placemark>
            <name>Main pasture</name>
            <Polygon><outerBoundaryIs><LinearRing><coordinates>
              24.000,-29.000,0 24.010,-29.000,0 24.010,-29.010,0
              24.000,-29.010,0 24.000,-29.000,0
            </coordinates></LinearRing></outerBoundaryIs></Polygon>
          </Placemark>
        </Document>
      </kml>
    `)

    expect(candidates).toHaveLength(2)
    expect(candidates[0].name).toBe("Main pasture")
    expect(candidates[0].areaHectares).toBeGreaterThan(candidates[1].areaHectares)
  })
})

