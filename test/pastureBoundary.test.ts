import {
  boundaryToEditableCoordinates,
  boundaryToMapShapes,
  createBoundaryFeature,
  formatBoundaryArea,
  getBoundaryMetrics,
  parseBoundaryFeature,
} from "@/utils/pastureBoundary"
import {
  boundaryCandidatesFromKml,
  buildPastureBoundaryImportPlan,
  generatePastureCode,
} from "@/utils/pastureBoundaryImport"

describe("pasture boundary geometry", () => {
  const coordinates = [
    { latitude: -29.001, longitude: 24.001 },
    { latitude: -29.001, longitude: 24.011 },
    { latitude: -29.011, longitude: 24.011 },
    { latitude: -29.011, longitude: 24.001 },
  ]

  it("closes a drawn polygon and preserves editable points", () => {
    const feature = createBoundaryFeature(coordinates, { name: "North camp" })
    const ring = feature.geometry.type === "Polygon" ? feature.geometry.coordinates[0] : []

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

  it("keeps multiple polygons with the same name as one multi-part pasture", () => {
    const candidates = boundaryCandidatesFromKml(`
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <Placemark>
            <name>River camp</name>
            <Polygon><outerBoundaryIs><LinearRing><coordinates>
              24.000,-29.000 24.002,-29.000 24.002,-29.002
              24.000,-29.002 24.000,-29.000
            </coordinates></LinearRing></outerBoundaryIs></Polygon>
          </Placemark>
          <Placemark>
            <name>River camp</name>
            <Polygon><outerBoundaryIs><LinearRing><coordinates>
              24.004,-29.000 24.006,-29.000 24.006,-29.002
              24.004,-29.002 24.004,-29.000
            </coordinates></LinearRing></outerBoundaryIs></Polygon>
          </Placemark>
        </Document>
      </kml>
    `)

    expect(candidates).toHaveLength(1)
    expect(candidates[0].name).toBe("River camp")
    expect(candidates[0].feature.geometry.type).toBe("MultiPolygon")
  })

  it("plans matching names as updates and creates unique codes for new pastures", () => {
    const candidates = boundaryCandidatesFromKml(`
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <Placemark>
            <name>North camp</name>
            <Polygon><outerBoundaryIs><LinearRing><coordinates>
              24.000,-29.000 24.002,-29.000 24.002,-29.002
              24.000,-29.002 24.000,-29.000
            </coordinates></LinearRing></outerBoundaryIs></Polygon>
          </Placemark>
          <Placemark>
            <name>New camp</name>
            <Polygon><outerBoundaryIs><LinearRing><coordinates>
              24.004,-29.000 24.006,-29.000 24.006,-29.002
              24.004,-29.002 24.004,-29.000
            </coordinates></LinearRing></outerBoundaryIs></Polygon>
          </Placemark>
        </Document>
      </kml>
    `)
    const plan = buildPastureBoundaryImportPlan(candidates, [
      { id: "pasture-1", name: "north CAMP", code: "NOCA" },
      { id: "pasture-2", name: "Old camp", code: "NECA" },
    ])

    expect(plan.find((item) => item.pastureName === "North camp")).toMatchObject({
      action: "update",
      existingPastureId: "pasture-1",
      pastureCode: "NOCA",
    })
    expect(plan.find((item) => item.pastureName === "New camp")).toMatchObject({
      action: "create",
      existingPastureId: null,
      pastureCode: "NECA2",
    })
    expect(generatePastureCode("A", [])).toBe("AP")
  })
})
