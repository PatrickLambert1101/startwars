import { buildCsv, csvEscape } from "../app/services/reports/csvFormat"
import {
  ageBracketForMonths,
  ageInMonths,
  groupAnimals,
  parseReportConfig,
  serializeReportConfig,
  DEFAULT_REPORT_COLUMNS,
  DEFAULT_REPORT_FILTERS,
  type ReportConfig,
  type ReportRow,
} from "../app/services/reports/reportConfig"

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysAgo(days: number, now: number): Date {
  return new Date(now - days * MS_PER_DAY)
}

// Minimal stand-in for a WatermelonDB Animal model — groupAnimals only reads fields
function fakeAnimal(fields: {
  id?: string
  breed?: string
  sex?: string
  status?: string
  currentPastureId?: string | null
  tagsList?: string[]
}) {
  return {
    id: fields.id ?? "a1",
    breed: fields.breed ?? "",
    sex: fields.sex ?? "",
    status: fields.status ?? "",
    currentPastureId: fields.currentPastureId ?? null,
    tagsList: fields.tagsList ?? [],
  } as any
}

function row(animal: any, ageMonths: number | null = null): ReportRow {
  return { animal, ageMonths, latestWeightKg: null, pastureName: null }
}

describe("ageInMonths", () => {
  const now = Date.UTC(2026, 6, 24)

  it("returns null without a date of birth", () => {
    expect(ageInMonths(null, now)).toBeNull()
  })

  it("computes whole months", () => {
    expect(ageInMonths(daysAgo(0, now), now)).toBe(0)
    expect(ageInMonths(daysAgo(31, now), now)).toBe(1)
    expect(ageInMonths(daysAgo(365, now), now)).toBe(11) // 365/30.44 = 11.99
    expect(ageInMonths(daysAgo(366, now), now)).toBe(12)
  })

  it("clamps future dates to 0 instead of going negative", () => {
    expect(ageInMonths(daysAgo(-10, now), now)).toBe(0)
  })
})

describe("ageBracketForMonths", () => {
  it("maps months onto brackets with correct boundaries", () => {
    expect(ageBracketForMonths(null)).toBe("unknown")
    expect(ageBracketForMonths(0)).toBe("under_6m")
    expect(ageBracketForMonths(5)).toBe("under_6m")
    expect(ageBracketForMonths(6)).toBe("6_12m")
    expect(ageBracketForMonths(11)).toBe("6_12m")
    expect(ageBracketForMonths(12)).toBe("1_2y")
    expect(ageBracketForMonths(23)).toBe("1_2y")
    expect(ageBracketForMonths(24)).toBe("2_5y")
    expect(ageBracketForMonths(59)).toBe("2_5y")
    expect(ageBracketForMonths(60)).toBe("over_5y")
    expect(ageBracketForMonths(200)).toBe("over_5y")
  })
})

describe("groupAnimals", () => {
  it("returns a single unnamed group when groupBy is null", () => {
    const rows = [row(fakeAnimal({ breed: "Nguni" }))]
    const groups = groupAnimals(rows, null)
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe("")
    expect(groups[0].rows).toHaveLength(1)
  })

  it("groups by breed, biggest group first, unknown last", () => {
    const rows = [
      row(fakeAnimal({ id: "1", breed: "Nguni" })),
      row(fakeAnimal({ id: "2", breed: "Nguni" })),
      row(fakeAnimal({ id: "3", breed: "Angus" })),
      row(fakeAnimal({ id: "4", breed: "" })),
    ]
    const groups = groupAnimals(rows, "breed")
    expect(groups.map((g) => g.key)).toEqual(["Nguni", "Angus", ""])
    expect(groups[0].rows).toHaveLength(2)
  })

  it("groups by age bracket in bracket order regardless of size", () => {
    const rows = [
      row(fakeAnimal({ id: "1" }), 70),
      row(fakeAnimal({ id: "2" }), 70),
      row(fakeAnimal({ id: "3" }), 2),
      row(fakeAnimal({ id: "4" }), null),
    ]
    const groups = groupAnimals(rows, "age_bracket")
    expect(groups.map((g) => g.key)).toEqual(["under_6m", "over_5y", "unknown"])
  })

  it("puts an animal in every tag group it carries", () => {
    const rows = [
      row(fakeAnimal({ id: "1", tagsList: ["For Sale", "Breeding Stock"] })),
      row(fakeAnimal({ id: "2", tagsList: [] })),
    ]
    const groups = groupAnimals(rows, "tag")
    const keys = groups.map((g) => g.key)
    expect(keys).toContain("For Sale")
    expect(keys).toContain("Breeding Stock")
    // untagged animal lands in the "" group, sorted last
    expect(keys[keys.length - 1]).toBe("")
  })
})

describe("report config serialization", () => {
  it("round-trips a config", () => {
    const config: ReportConfig = {
      filters: { ...DEFAULT_REPORT_FILTERS, breeds: ["Nguni"], ageFromMonths: 6 },
      groupBy: "breed",
      columns: ["visualTag", "breed"],
      sections: ["weights"],
    }
    expect(parseReportConfig(serializeReportConfig(config))).toEqual(config)
  })

  it("fills defaults for missing fields (old templates stay loadable)", () => {
    const parsed = parseReportConfig(JSON.stringify({ filters: { breeds: ["Angus"] } }))
    expect(parsed.filters.breeds).toEqual(["Angus"])
    expect(parsed.filters.pastureIds).toEqual([])
    expect(parsed.groupBy).toBeNull()
    expect(parsed.columns).toEqual(DEFAULT_REPORT_COLUMNS)
    expect(parsed.sections).toEqual([])
  })
})

describe("csv formatting", () => {
  it("preserves commas, quotes and newlines via RFC-4180 quoting", () => {
    expect(csvEscape('say "moo", twice')).toBe('"say ""moo"", twice"')
    expect(csvEscape(null)).toBe('""')
    expect(csvEscape(12.5)).toBe('"12.5"')
    const csv = buildCsv([
      ["Tag", "Notes"],
      ["A12", "line1\nline2, with comma"],
    ])
    expect(csv).toBe('"Tag","Notes"\r\n"A12","line1\nline2, with comma"')
  })
})
