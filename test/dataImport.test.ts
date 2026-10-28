import { BREEDS_BY_SPECIES } from "@/db/models/Animal"
import { schema } from "@/db/schema"
import {
  ANIMAL_IMPORT_FIELDS,
  GRAZING_IMPORT_FIELDS,
  TREATMENT_IMPORT_FIELDS,
} from "@/services/dataImport/definitions"
import { autoMapColumns, rowsToSpreadsheetSheet } from "@/services/dataImport/spreadsheet"
import {
  validateAnimalImport,
  validateGrazingImport,
  validateTreatmentImport,
} from "@/services/dataImport/validation"
import { parseImportDate } from "@/services/dataImport/valueParsing"

describe("data import schema", () => {
  it("ships import history and external pedigree fields in schema v23", () => {
    expect(schema.version).toBe(23)
    expect(schema.tables.grazing_periods).toBeDefined()
    expect(schema.tables.data_import_batches).toBeDefined()
    expect(schema.tables.animals.columns.external_sire_reference).toBeDefined()
    expect(schema.tables.animals.columns.source_name).toBeDefined()
  })
})

describe("spreadsheet import", () => {
  it("maps the useful fields in the supplied cattle workbook format", () => {
    const sheet = rowsToSpreadsheetSheet("Cows", [
      [
        "Cow ID",
        "Name",
        "Breed",
        "Birth Date",
        "Sire",
        "Dam",
        "Acquired (Purchase/Birth)",
        "Current Status",
        "Notes",
        "Age (years)",
      ],
      [
        "C102",
        "Daisy",
        "Bonsmara",
        "14/06/2024",
        "B12",
        "C087",
        "Birth",
        "In calf",
        "",
        2,
        744,
        1,
        2025,
        2026,
      ],
    ])

    const mapping = autoMapColumns(sheet?.headers ?? [], ANIMAL_IMPORT_FIELDS)
    expect(mapping.visualTag).toBe(0)
    expect(mapping.name).toBe(1)
    expect(mapping.breed).toBe(2)
    expect(mapping.dateOfBirth).toBe(3)
    expect(mapping.sireReference).toBe(4)
    expect(mapping.damReference).toBe(5)
    expect(mapping.acquisition).toBe(6)
    expect(mapping.status).toBe(7)
    expect(mapping.notes).toBe(8)
  })

  it("finds a header row and maps familiar treatment headings", () => {
    const sheet = rowsToSpreadsheetSheet("Treatments", [
      ["Farm treatment export"],
      ["Ear Tag", "Treatment Date", "Medicine", "Dose", "Comments"],
      ["C102", "14/06/2026", "Tick product", "10 ml", "High tick load"],
    ])

    expect(sheet).not.toBeNull()
    expect(sheet?.rows).toHaveLength(1)
    expect(sheet?.rows[0].rowNumber).toBe(3)

    const mapping = autoMapColumns(sheet?.headers ?? [], TREATMENT_IMPORT_FIELDS)
    expect(mapping.animalTag).toBe(0)
    expect(mapping.recordDate).toBe(1)
    expect(mapping.productName).toBe(2)
    expect(mapping.dosage).toBe(3)
    expect(mapping.notes).toBe(4)
  })

  it("parses South African day-first dates without swapping month and day", () => {
    const date = parseImportDate("05/06/2026")
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(5)
    expect(date?.getDate()).toBe(5)
  })
})

describe("animal import validation", () => {
  it("offers South African breeds and normalized workbook crosses", () => {
    expect(BREEDS_BY_SPECIES.cattle).toEqual(
      expect.arrayContaining([
        "Nguni",
        "Boran",
        "PinZyl",
        "Pinzgauer",
        "Boran/Nguni × PinZyl",
        "Boran/Nguni × Nguni",
        "Nguni × Nguni/Boran",
        "Nguni × Nguni/Boran/Pinzgauer",
      ]),
    )
  })

  it("previews a cow row with safe defaults and preserves acquisition notes", () => {
    const sheet = rowsToSpreadsheetSheet("Cows", [
      [
        "Cow ID",
        "Name",
        "Breed",
        "Birth Date",
        "Sire",
        "Dam",
        "Acquired (Purchase/Birth)",
        "Current Status",
        "Notes",
      ],
      ["C102", "Daisy", "Bonsmara", "14/06/2024", "B12", "C087", "Birth", "In calf", "Calm"],
      ["B12", "Boris", "Bonsmara", "10/02/2020", "", "", "Purchase", "Active", ""],
      ["C087", "Milly", "Bonsmara", "03/04/2020", "", "", "Birth", "Active", ""],
    ])
    expect(sheet).not.toBeNull()

    const mapping = autoMapColumns(sheet?.headers ?? [], ANIMAL_IMPORT_FIELDS)
    const preview = validateAnimalImport(sheet?.rows ?? [], mapping, [], "Cows")

    expect(preview[0].canImport).toBe(true)
    expect(preview[0].record).toMatchObject({
      visualTag: "C102",
      name: "Daisy",
      species: "cattle",
      breed: "Bonsmara",
      sex: "female",
      status: "active",
      sireReference: "B12",
      damReference: "C087",
      notes: "Calm\nAcquired: Birth",
      tags: [],
    })
    expect(preview[0].record?.dateOfBirth?.getFullYear()).toBe(2024)
  })

  it("applies import-wide breed, sex, and management tags", () => {
    const sheet = rowsToSpreadsheetSheet("Mixed animals", [
      ["Cow ID", "Breed", "Sex"],
      ["C204", "Nguni", "M"],
    ])
    const mapping = autoMapColumns(sheet?.headers ?? [], ANIMAL_IMPORT_FIELDS)
    const preview = validateAnimalImport(
      sheet?.rows ?? [],
      mapping,
      [],
      "Mixed animals",
      "cattle",
      {
        breed: "PinZyl",
        sex: "female",
        tags: ["Purchased Herd", "Breeding Stock"],
      },
    )

    expect(preview[0].record).toMatchObject({
      visualTag: "C204",
      breed: "PinZyl",
      sex: "female",
      tags: ["Purchased Herd", "Breeding Stock"],
    })
    expect(preview[0].detail).toContain("PinZyl • female")
  })

  it("preserves outside parent breeds and the source breeder", () => {
    const sheet = rowsToSpreadsheetSheet("Purchased bulls", [
      ["Cow ID", "Sex", "Sire", "Sire Breed", "Dam", "Dam Breed", "Source Farm"],
      ["B204", "Bull", "S-88", "Boran", "D-40", "Nguni", "Douglas Spencer Stud"],
    ])
    const mapping = autoMapColumns(sheet?.headers ?? [], ANIMAL_IMPORT_FIELDS)
    const preview = validateAnimalImport(sheet?.rows ?? [], mapping, [], "Purchased bulls")

    expect(preview[0].canImport).toBe(true)
    expect(preview[0].record).toMatchObject({
      visualTag: "B204",
      sireReference: "S-88",
      sireBreed: "Boran",
      damReference: "D-40",
      damBreed: "Nguni",
      sourceName: "Douglas Spencer Stud",
    })
    expect(preview[0].issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "parent_not_found", severity: "warning" }),
      ]),
    )
  })

  it("accepts a farm-specific custom breed label", () => {
    const sheet = rowsToSpreadsheetSheet("Cows", [
      ["Cow ID", "Breed"],
      ["C205", "Nguni"],
    ])
    const mapping = autoMapColumns(sheet?.headers ?? [], ANIMAL_IMPORT_FIELDS)
    const preview = validateAnimalImport(sheet?.rows ?? [], mapping, [], "Cows", "cattle", {
      breed: "Nguni × Lambert Composite",
    })

    expect(preview[0].canImport).toBe(true)
    expect(preview[0].record?.breed).toBe("Nguni × Lambert Composite")
  })

  it("blocks a tag that already exists in HerdTrackr", () => {
    const sheet = rowsToSpreadsheetSheet("Cows", [
      ["Cow ID", "Name"],
      ["C102", "Duplicate Daisy"],
    ])
    const mapping = autoMapColumns(sheet?.headers ?? [], ANIMAL_IMPORT_FIELDS)
    const preview = validateAnimalImport(
      sheet?.rows ?? [],
      mapping,
      [
        {
          id: "animal-1",
          visualTag: "c102",
          rfidTag: "",
          displayName: "Daisy",
          name: "Daisy",
        },
      ],
      "Cows",
    )

    expect(preview[0].canImport).toBe(false)
    expect(preview[0].issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate_visual_tag", severity: "error" }),
      ]),
    )
  })

  it("blocks summary rows found below the Herd log", () => {
    const sheet = rowsToSpreadsheetSheet("Herd (log)", [
      [
        "TAG#",
        "TAG/Blank",
        "Dam (Cow ID)",
        "Sire",
        "Sex",
        "Birth Date",
        "Birth Weight (kg)",
        "Current Status",
        "Notes",
      ],
      ["Current Herd", 9, "", "", "", "", "", "", ""],
    ])
    const mapping = autoMapColumns(sheet?.headers ?? [], ANIMAL_IMPORT_FIELDS)
    const preview = validateAnimalImport(sheet?.rows ?? [], mapping, [], "Herd (log)")

    expect(preview[0].canImport).toBe(false)
    expect(preview[0].issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "summary_row", severity: "error" })]),
    )
  })
})

describe("treatment import validation", () => {
  const rows = [
    {
      rowNumber: 2,
      values: ["C102", "14/06/2026", "Treatment", "Tick treatment", "Deadline", "10 ml"],
    },
  ]
  const mapping = {
    animalTag: 0,
    recordDate: 1,
    recordType: 2,
    description: 3,
    productName: 4,
    dosage: 5,
  }
  const animals = [
    {
      id: "animal-1",
      rfidTag: "900001",
      visualTag: "C102",
      displayName: "C102",
    },
  ]

  it("matches an animal by visual tag and prepares a health record", () => {
    const preview = validateTreatmentImport(rows, mapping, animals, [])
    expect(preview[0].canImport).toBe(true)
    expect(preview[0].record?.animalId).toBe("animal-1")
    expect(preview[0].record?.productName).toBe("Deadline")
  })

  it("blocks an existing duplicate treatment", () => {
    const preview = validateTreatmentImport(rows, mapping, animals, [
      {
        animalId: "animal-1",
        recordDate: new Date(2026, 5, 14, 12),
        recordType: "treatment",
        description: "Tick treatment",
        productName: "Deadline",
        dosage: "10 ml",
      },
    ])

    expect(preview[0].canImport).toBe(false)
    expect(preview[0].issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "duplicate", severity: "error" })]),
    )
  })
})

describe("grazing history validation", () => {
  it("matches a pasture and warns, but does not block, an overlapping period", () => {
    const sheet = rowsToSpreadsheetSheet("Grazing", [
      ["Pasture Code", "Start Date", "End Date", "Herd", "Head Count"],
      ["NORTH", "05/05/2026", "10/05/2026", "Breeding herd", 43],
    ])
    expect(sheet).not.toBeNull()

    const mapping = autoMapColumns(sheet?.headers ?? [], GRAZING_IMPORT_FIELDS)
    const preview = validateGrazingImport(
      sheet?.rows ?? [],
      mapping,
      [{ id: "pasture-1", name: "North Camp", code: "NORTH" }],
      [
        {
          pastureId: "pasture-1",
          startDate: new Date(2026, 4, 1, 12),
          endDate: new Date(2026, 4, 7, 12),
          herdGroup: "Breeding herd",
        },
      ],
    )

    expect(preview[0].canImport).toBe(true)
    expect(preview[0].record?.animalCount).toBe(43)
    expect(preview[0].issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "overlap", severity: "warning" })]),
    )
  })
})
