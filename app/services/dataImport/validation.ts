import type { HealthRecordType } from "@/db/models"
import type { AnimalSex, AnimalSpecies } from "@/db/models/Animal"

import { cellText, mappedCell } from "./spreadsheet"
import type {
  AnimalImportRecord,
  AnimalImportSettings,
  ColumnMapping,
  GrazingImportRecord,
  ImportIssue,
  ImportPreviewRow,
  SpreadsheetRow,
  TreatmentImportRecord,
} from "./types"
import {
  addDays,
  dateKey,
  normalizeReference,
  parseHealthRecordType,
  parseAnimalSex,
  parseAnimalSpecies,
  parseAnimalStatus,
  parseImportDate,
  parseImportBoolean,
  parseNonNegativeInteger,
  parsePositiveInteger,
} from "./valueParsing"

export interface AnimalImportReference {
  id: string
  rfidTag: string
  visualTag: string
  displayName: string
  name?: string | null
}

export interface ExistingTreatmentReference {
  animalId: string
  recordDate: Date
  recordType: HealthRecordType
  description: string
  productName: string | null
  dosage: string | null
}

export interface PastureImportReference {
  id: string
  name: string
  code: string
}

export interface ExistingGrazingReference {
  pastureId: string
  startDate: Date
  endDate: Date | null
  herdGroup: string | null
}

function issue(severity: ImportIssue["severity"], code: string, message: string): ImportIssue {
  return { severity, code, message }
}

function addLookup<T>(lookup: Map<string, T[]>, reference: string, value: T): void {
  const key = normalizeReference(reference)
  if (!key) return
  lookup.set(key, [...(lookup.get(key) ?? []), value])
}

function endOfToday(): Date {
  const date = new Date()
  date.setHours(23, 59, 59, 999)
  return date
}

function treatmentFingerprint(record: {
  animalId: string
  recordDate: Date
  recordType: HealthRecordType
  description: string
  productName?: string | null
  dosage?: string | null
}): string {
  return [
    record.animalId,
    dateKey(record.recordDate),
    record.recordType,
    normalizeReference(record.description),
    normalizeReference(record.productName),
    normalizeReference(record.dosage),
  ].join("|")
}

const SUMMARY_ROW_IDENTIFIERS = new Set([
  "COUNT",
  "CURRENTHERD",
  "INFIELDCOUNT",
  "INFILEDCOUNT",
  "SUMMARY",
  "TOTAL",
])

const EMPTY_PARENT_REFERENCES = new Set(["", "BULL", "COW", "NA", "N/A", "NONE", "UNKNOWN", "UNK"])

function defaultSexForSheet(sheetName: string): AnimalSex {
  const normalized = sheetName.trim().toLowerCase()
  if (normalized.includes("bull")) return "male"
  if (normalized.includes("cow")) return "female"
  return "unknown"
}

function addUniqueLookup(
  lookup: Map<string, Map<string, string>>,
  reference: string | null | undefined,
  id: string,
  label: string,
): void {
  const key = normalizeReference(reference)
  if (!key) return
  const matches = lookup.get(key) ?? new Map<string, string>()
  matches.set(id, label)
  lookup.set(key, matches)
}

function validateParentReference(
  relationship: "Sire" | "Dam",
  reference: string,
  selfReferences: Set<string>,
  referenceLookup: Map<string, Map<string, string>>,
  issues: ImportIssue[],
): void {
  const key = normalizeReference(reference)
  if (EMPTY_PARENT_REFERENCES.has(key)) return
  if (selfReferences.has(key)) {
    issues.push(
      issue("error", "self_parent", `${relationship} cannot be the same animal as this row.`),
    )
    return
  }

  const matches = referenceLookup.get(key)
  if (!matches || matches.size === 0) {
    issues.push(
      issue(
        "warning",
        "parent_not_found",
        `${relationship} “${reference}” is not in this herd and will be kept as an external parent ID.`,
      ),
    )
  } else if (matches.size > 1) {
    issues.push(
      issue(
        "warning",
        "parent_ambiguous",
        `${relationship} “${reference}” matches more than one herd animal and will be kept as an external parent ID.`,
      ),
    )
  }
}

export function validateAnimalImport(
  rows: SpreadsheetRow[],
  mapping: ColumnMapping,
  existingAnimals: AnimalImportReference[],
  sheetName: string,
  defaultSpecies: AnimalSpecies = "cattle",
  importSettings: AnimalImportSettings = {},
): ImportPreviewRow<AnimalImportRecord>[] {
  const existingVisualTags = new Map<string, AnimalImportReference[]>()
  const existingRfidTags = new Map<string, AnimalImportReference[]>()
  const allReferences = new Map<string, Map<string, string>>()

  existingAnimals.forEach((animal) => {
    addLookup(existingVisualTags, animal.visualTag, animal)
    addLookup(existingRfidTags, animal.rfidTag, animal)
    addUniqueLookup(allReferences, animal.visualTag, animal.id, animal.displayName)
    addUniqueLookup(allReferences, animal.rfidTag, animal.id, animal.displayName)
    addUniqueLookup(allReferences, animal.name, animal.id, animal.displayName)
  })

  rows.forEach((row) => {
    const id = `file-row-${row.rowNumber}`
    const visualTag = cellText(mappedCell(row, mapping, "visualTag"))
    const rfidTag = cellText(mappedCell(row, mapping, "rfidTag"))
    const name = cellText(mappedCell(row, mapping, "name"))
    const label = name || visualTag || rfidTag || `Row ${row.rowNumber}`
    addUniqueLookup(allReferences, visualTag, id, label)
    addUniqueLookup(allReferences, rfidTag, id, label)
    addUniqueLookup(allReferences, name, id, label)
  })

  const fileVisualTags = new Set<string>()
  const fileRfidTags = new Set<string>()
  const today = endOfToday()
  const sheetDefaultSex = defaultSexForSheet(sheetName)

  return rows.map((row) => {
    const issues: ImportIssue[] = []
    const visualTag = cellText(mappedCell(row, mapping, "visualTag"))
    const rfidTag = cellText(mappedCell(row, mapping, "rfidTag"))
    const name = cellText(mappedCell(row, mapping, "name")) || undefined
    const primaryReference = visualTag || rfidTag
    const normalizedPrimary = normalizeReference(primaryReference)
    const isSummaryRow = SUMMARY_ROW_IDENTIFIERS.has(normalizedPrimary)

    if (isSummaryRow) {
      issues.push(issue("error", "summary_row", "This looks like a summary row, not an animal."))
    } else if (!primaryReference) {
      issues.push(
        issue("error", "missing_identity", "A visual tag or RFID is required for every animal."),
      )
    }

    const visualKey = normalizeReference(visualTag)
    if (visualKey) {
      if (existingVisualTags.has(visualKey)) {
        issues.push(
          issue("error", "duplicate_visual_tag", `Visual tag “${visualTag}” already exists.`),
        )
      } else if (fileVisualTags.has(visualKey)) {
        issues.push(
          issue(
            "error",
            "duplicate_visual_tag",
            `Visual tag “${visualTag}” appears more than once in this file.`,
          ),
        )
      }
      fileVisualTags.add(visualKey)
    }

    const rfidKey = normalizeReference(rfidTag)
    if (rfidKey) {
      if (existingRfidTags.has(rfidKey)) {
        issues.push(issue("error", "duplicate_rfid", `RFID “${rfidTag}” already exists.`))
      } else if (fileRfidTags.has(rfidKey)) {
        issues.push(
          issue(
            "error",
            "duplicate_rfid",
            `RFID “${rfidTag}” appears more than once in this file.`,
          ),
        )
      }
      fileRfidTags.add(rfidKey)
    }

    const speciesCell = mappedCell(row, mapping, "species")
    const species = parseAnimalSpecies(speciesCell, defaultSpecies)
    if (cellText(speciesCell) && !species.recognized) {
      issues.push(
        issue(
          "warning",
          "unknown_species",
          `Species “${cellText(speciesCell)}” was not recognised; ${defaultSpecies} will be used.`,
        ),
      )
    }

    const sexCell = mappedCell(row, mapping, "sex")
    const sex = parseAnimalSex(sexCell, sheetDefaultSex)
    if (!importSettings.sex && cellText(sexCell) && !sex.recognized) {
      issues.push(
        issue(
          "warning",
          "unknown_sex",
          `Sex “${cellText(sexCell)}” was not recognised; ${sheetDefaultSex} will be used.`,
        ),
      )
    }

    const statusCell = mappedCell(row, mapping, "status")
    const status = parseAnimalStatus(statusCell)
    if (cellText(statusCell) && !status.recognized) {
      issues.push(
        issue(
          "warning",
          "unknown_status",
          `Status “${cellText(statusCell)}” was not recognised; Active will be used.`,
        ),
      )
    }

    const birthDateCell = mappedCell(row, mapping, "dateOfBirth")
    const dateOfBirth = cellText(birthDateCell) ? parseImportDate(birthDateCell) : null
    if (cellText(birthDateCell) && !dateOfBirth) {
      issues.push(issue("error", "invalid_birth_date", "Birth date is not valid."))
    } else if (dateOfBirth && dateOfBirth > today) {
      issues.push(issue("warning", "future_birth_date", "Birth date is in the future."))
    }

    const vaccinationCell = mappedCell(row, mapping, "vaccinationsUpToDate")
    const explicitUnknown = ["unknown", "not known", "unsure"].includes(cellText(vaccinationCell).toLowerCase())
    const vaccinations = parseImportBoolean(vaccinationCell, true)
    if (cellText(vaccinationCell) && !explicitUnknown && !vaccinations.recognized) {
      issues.push(
        issue(
          "warning",
          "unknown_vaccination_status",
          `Vaccination value “${cellText(vaccinationCell)}” was not recognised; history will be marked Unknown.`,
        ),
      )
    }

    const sireReference = cellText(mappedCell(row, mapping, "sireReference")) || undefined
    const sireBreed = cellText(mappedCell(row, mapping, "sireBreed")) || undefined
    const damReference = cellText(mappedCell(row, mapping, "damReference")) || undefined
    const damBreed = cellText(mappedCell(row, mapping, "damBreed")) || undefined
    const selfReferences = new Set(
      [visualTag, rfidTag, name].map(normalizeReference).filter(Boolean),
    )
    if (sireReference) {
      validateParentReference("Sire", sireReference, selfReferences, allReferences, issues)
    }
    if (damReference) {
      validateParentReference("Dam", damReference, selfReferences, allReferences, issues)
    }

    const acquisition = cellText(mappedCell(row, mapping, "acquisition"))
    const sourceNotes = cellText(mappedCell(row, mapping, "notes"))
    const notes =
      [sourceNotes, acquisition ? `Acquired: ${acquisition}` : ""].filter(Boolean).join("\n") ||
      undefined
    const breed =
      importSettings.breed?.trim() || cellText(mappedCell(row, mapping, "breed")) || "Mixed"
    const importedSex = importSettings.sex ?? sex.value
    const tags = [...new Set((importSettings.tags ?? []).map((tag) => tag.trim()).filter(Boolean))]

    const record =
      primaryReference && !isSummaryRow
        ? {
            rowNumber: row.rowNumber,
            visualTag,
            rfidTag,
            name,
            species: species.value,
            breed,
            sex: importedSex,
            dateOfBirth: dateOfBirth ?? undefined,
            status: status.value,
            vaccinationsUpToDate: vaccinations.value,
            vaccinationHistory: !cellText(vaccinationCell) || !vaccinations.recognized
              ? "unknown" as const : vaccinations.value ? "current" as const : "needs_review" as const,
            registrationNumber:
              cellText(mappedCell(row, mapping, "registrationNumber")) || undefined,
            herdTag: cellText(mappedCell(row, mapping, "herdTag")) || undefined,
            notes,
            tags,
            sireReference,
            sireBreed,
            damReference,
            damBreed,
            sourceName: cellText(mappedCell(row, mapping, "sourceName")) || undefined,
          }
        : undefined

    return {
      rowNumber: row.rowNumber,
      sourceLabel: name || primaryReference || `Row ${row.rowNumber}`,
      detail: [
        species.value,
        breed,
        importedSex,
        dateOfBirth ? `Born ${dateKey(dateOfBirth)}` : undefined,
      ]
        .filter(Boolean)
        .join(" • "),
      record,
      issues,
      canImport: Boolean(record) && !issues.some((item) => item.severity === "error"),
    }
  })
}

export function validateTreatmentImport(
  rows: SpreadsheetRow[],
  mapping: ColumnMapping,
  animals: AnimalImportReference[],
  existingRecords: ExistingTreatmentReference[],
): ImportPreviewRow<TreatmentImportRecord>[] {
  const animalLookup = new Map<string, AnimalImportReference[]>()
  animals.forEach((animal) => {
    addLookup(animalLookup, animal.rfidTag, animal)
    if (normalizeReference(animal.visualTag) !== normalizeReference(animal.rfidTag)) {
      addLookup(animalLookup, animal.visualTag, animal)
    }
  })

  const fingerprints = new Set(existingRecords.map(treatmentFingerprint))
  const fileFingerprints = new Set<string>()
  const today = endOfToday()

  return rows.map((row) => {
    const issues: ImportIssue[] = []
    const tag = cellText(mappedCell(row, mapping, "animalTag"))
    const matches = animalLookup.get(normalizeReference(tag)) ?? []
    const recordDateCell = mappedCell(row, mapping, "recordDate")
    const recordDate = parseImportDate(recordDateCell)

    if (!tag) {
      issues.push(issue("error", "missing_animal", "Animal tag is required."))
    } else if (matches.length === 0) {
      issues.push(issue("error", "animal_not_found", `No animal matches “${tag}”.`))
    } else if (matches.length > 1) {
      issues.push(issue("error", "animal_ambiguous", `More than one animal matches “${tag}”.`))
    }

    if (!cellText(recordDateCell)) {
      issues.push(issue("error", "missing_date", "Treatment date is required."))
    } else if (!recordDate) {
      issues.push(issue("error", "invalid_date", "Treatment date is not valid."))
    } else if (recordDate > today) {
      issues.push(issue("warning", "future_date", "Treatment date is in the future."))
    }

    const recordType = parseHealthRecordType(mappedCell(row, mapping, "recordType"))
    const productName = cellText(mappedCell(row, mapping, "productName")) || undefined
    const description =
      cellText(mappedCell(row, mapping, "description")) || productName || "Imported treatment"
    const dosage = cellText(mappedCell(row, mapping, "dosage")) || undefined
    const administeredBy = cellText(mappedCell(row, mapping, "administeredBy")) || undefined
    const notes = cellText(mappedCell(row, mapping, "notes")) || undefined

    let withdrawalDate: Date | undefined
    const withdrawalDateCell = mappedCell(row, mapping, "withdrawalDate")
    const withdrawalDaysCell = mappedCell(row, mapping, "withdrawalDays")

    if (cellText(withdrawalDateCell)) {
      withdrawalDate = parseImportDate(withdrawalDateCell) ?? undefined
      if (!withdrawalDate) {
        issues.push(issue("error", "invalid_withdrawal_date", "Withdrawal date is not valid."))
      }
    } else if (cellText(withdrawalDaysCell)) {
      const withdrawalDays = parseNonNegativeInteger(withdrawalDaysCell)
      if (withdrawalDays === null) {
        issues.push(
          issue("error", "invalid_withdrawal_days", "Withdrawal days must be zero or more."),
        )
      } else if (recordDate) {
        withdrawalDate = addDays(recordDate, withdrawalDays)
      }
    }

    if (withdrawalDate && recordDate && withdrawalDate < recordDate) {
      issues.push(
        issue(
          "warning",
          "withdrawal_before_treatment",
          "Withdrawal date is before the treatment date.",
        ),
      )
    }

    const animal = matches.length === 1 ? matches[0] : undefined
    let record: TreatmentImportRecord | undefined

    if (animal && recordDate) {
      record = {
        rowNumber: row.rowNumber,
        animalId: animal.id,
        animalLabel: animal.displayName,
        recordDate,
        recordType,
        description,
        productName,
        dosage,
        administeredBy,
        withdrawalDate,
        notes,
      }

      const fingerprint = treatmentFingerprint(record)
      if (fingerprints.has(fingerprint) || fileFingerprints.has(fingerprint)) {
        issues.push(
          issue("error", "duplicate", "This treatment appears to have already been recorded."),
        )
      } else {
        fileFingerprints.add(fingerprint)
      }
    }

    return {
      rowNumber: row.rowNumber,
      sourceLabel: tag || `Row ${row.rowNumber}`,
      detail: [recordDate ? dateKey(recordDate) : "Invalid date", productName || description].join(
        " • ",
      ),
      record,
      issues,
      canImport: Boolean(record) && !issues.some((item) => item.severity === "error"),
    }
  })
}

function grazingFingerprint(record: {
  pastureId: string
  startDate: Date
  endDate?: Date | null
  herdGroup?: string | null
}): string {
  return [
    record.pastureId,
    dateKey(record.startDate),
    record.endDate ? dateKey(record.endDate) : "",
    normalizeReference(record.herdGroup),
  ].join("|")
}

function periodsOverlap(
  first: { startDate: Date; endDate?: Date | null },
  second: { startDate: Date; endDate?: Date | null },
): boolean {
  const firstEnd = first.endDate?.getTime() ?? Number.POSITIVE_INFINITY
  const secondEnd = second.endDate?.getTime() ?? Number.POSITIVE_INFINITY
  return first.startDate.getTime() <= secondEnd && second.startDate.getTime() <= firstEnd
}

export function validateGrazingImport(
  rows: SpreadsheetRow[],
  mapping: ColumnMapping,
  pastures: PastureImportReference[],
  existingPeriods: ExistingGrazingReference[],
): ImportPreviewRow<GrazingImportRecord>[] {
  const pastureLookup = new Map<string, PastureImportReference[]>()
  pastures.forEach((pasture) => {
    addLookup(pastureLookup, pasture.code, pasture)
    if (normalizeReference(pasture.name) !== normalizeReference(pasture.code)) {
      addLookup(pastureLookup, pasture.name, pasture)
    }
  })

  const fingerprints = new Set(existingPeriods.map(grazingFingerprint))
  const fileFingerprints = new Set<string>()
  const filePeriods: GrazingImportRecord[] = []
  const today = endOfToday()

  return rows.map((row) => {
    const issues: ImportIssue[] = []
    const pastureReference = cellText(mappedCell(row, mapping, "pasture"))
    const matches = pastureLookup.get(normalizeReference(pastureReference)) ?? []
    const startCell = mappedCell(row, mapping, "startDate")
    const endCell = mappedCell(row, mapping, "endDate")
    const startDate = parseImportDate(startCell)
    const endDate = cellText(endCell) ? parseImportDate(endCell) : null

    if (!pastureReference) {
      issues.push(issue("error", "missing_pasture", "Pasture is required."))
    } else if (matches.length === 0) {
      issues.push(issue("error", "pasture_not_found", `No pasture matches “${pastureReference}”.`))
    } else if (matches.length > 1) {
      issues.push(
        issue("error", "pasture_ambiguous", `More than one pasture matches “${pastureReference}”.`),
      )
    }

    if (!cellText(startCell)) {
      issues.push(issue("error", "missing_start_date", "Start date is required."))
    } else if (!startDate) {
      issues.push(issue("error", "invalid_start_date", "Start date is not valid."))
    }

    if (cellText(endCell) && !endDate) {
      issues.push(issue("error", "invalid_end_date", "End date is not valid."))
    }
    if (startDate && endDate && endDate < startDate) {
      issues.push(issue("error", "end_before_start", "End date is before the start date."))
    }
    if (startDate && startDate > today) {
      issues.push(issue("warning", "future_start", "Grazing period starts in the future."))
    }

    const herdGroup = cellText(mappedCell(row, mapping, "herdGroup")) || undefined
    const animalCountCell = mappedCell(row, mapping, "animalCount")
    const animalCount = cellText(animalCountCell) ? parsePositiveInteger(animalCountCell) : null
    if (cellText(animalCountCell) && animalCount === null) {
      issues.push(
        issue("error", "invalid_animal_count", "Animal count must be a whole number above zero."),
      )
    }
    const notes = cellText(mappedCell(row, mapping, "notes")) || undefined

    const pasture = matches.length === 1 ? matches[0] : undefined
    let record: GrazingImportRecord | undefined

    if (pasture && startDate && (!cellText(endCell) || endDate)) {
      record = {
        rowNumber: row.rowNumber,
        pastureId: pasture.id,
        pastureLabel: pasture.name,
        startDate,
        endDate: endDate ?? undefined,
        herdGroup,
        animalCount: animalCount ?? undefined,
        notes,
      }

      const fingerprint = grazingFingerprint(record)
      if (fingerprints.has(fingerprint) || fileFingerprints.has(fingerprint)) {
        issues.push(
          issue("error", "duplicate", "This grazing period appears to have already been recorded."),
        )
      } else {
        fileFingerprints.add(fingerprint)
      }

      const overlapsExisting = existingPeriods.some(
        (period) => period.pastureId === pasture.id && periodsOverlap(record!, period),
      )
      const overlapsFile = filePeriods.some(
        (period) => period.pastureId === pasture.id && periodsOverlap(record!, period),
      )
      if (overlapsExisting || overlapsFile) {
        issues.push(
          issue(
            "warning",
            "overlap",
            "This period overlaps another grazing period for the pasture.",
          ),
        )
      }
      filePeriods.push(record)
    }

    const dateRange = startDate
      ? `${dateKey(startDate)}${endDate ? ` to ${dateKey(endDate)}` : " onward"}`
      : "Invalid date"

    return {
      rowNumber: row.rowNumber,
      sourceLabel: pastureReference || `Row ${row.rowNumber}`,
      detail: [dateRange, herdGroup].filter(Boolean).join(" • "),
      record,
      issues,
      canImport: Boolean(record) && !issues.some((item) => item.severity === "error"),
    }
  })
}
