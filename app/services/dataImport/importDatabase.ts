import { Q } from "@nozbe/watermelondb"

import { database } from "@/db"
import { Animal, DataImportBatch, GrazingPeriod, HealthRecord, Pasture } from "@/db/models"
import { calculateScheduledVaccinations } from "@/services/vaccinationScheduler"

import type {
  AnimalImportRecord,
  AnimalImportSettings,
  ColumnMapping,
  DataImportType,
  GrazingImportRecord,
  ImportExecutionResult,
  ImportPreviewRow,
  SpreadsheetSheet,
  TreatmentImportRecord,
} from "./types"
import { validateAnimalImport, validateGrazingImport, validateTreatmentImport } from "./validation"
import { normalizeReference } from "./valueParsing"

interface ImportActor {
  userId?: string | null
  userName?: string | null
}

interface ExecuteImportOptions extends ImportActor {
  organizationId: string
  fileName: string
  sheetName: string
  totalRows: number
}

interface ExecuteAnimalImportOptions extends ExecuteImportOptions {
  animalLimit: number
}

export class AnimalImportLimitError extends Error {
  constructor(
    public readonly limit: number,
    public readonly available: number,
  ) {
    super(`This plan allows ${limit} animals and has room for ${available} more.`)
    this.name = "AnimalImportLimitError"
  }
}

export async function previewAnimalImport(
  organizationId: string,
  sheet: SpreadsheetSheet,
  mapping: ColumnMapping,
  defaultSpecies: AnimalImportRecord["species"] = "cattle",
  importSettings: AnimalImportSettings = {},
): Promise<ImportPreviewRow<AnimalImportRecord>[]> {
  const animals = await database
    .get<Animal>("animals")
    .query(Q.where("organization_id", organizationId), Q.where("is_deleted", false))
    .fetch()

  return validateAnimalImport(
    sheet.rows,
    mapping,
    animals.map((animal) => ({
      id: animal.id,
      rfidTag: animal.rfidTag,
      visualTag: animal.visualTag,
      displayName: animal.displayName,
      name: animal.name,
    })),
    sheet.name,
    defaultSpecies,
    importSettings,
  )
}

export async function previewTreatmentImport(
  organizationId: string,
  sheet: SpreadsheetSheet,
  mapping: ColumnMapping,
): Promise<ImportPreviewRow<TreatmentImportRecord>[]> {
  const [animals, existingRecords] = await Promise.all([
    database
      .get<Animal>("animals")
      .query(Q.where("organization_id", organizationId), Q.where("is_deleted", false))
      .fetch(),
    database
      .get<HealthRecord>("health_records")
      .query(Q.where("organization_id", organizationId), Q.where("is_deleted", false))
      .fetch(),
  ])

  return validateTreatmentImport(
    sheet.rows,
    mapping,
    animals.map((animal) => ({
      id: animal.id,
      rfidTag: animal.rfidTag,
      visualTag: animal.visualTag,
      displayName: animal.displayName,
    })),
    existingRecords.map((record) => ({
      animalId: record.animalId,
      recordDate: record.recordDate,
      recordType: record.recordType,
      description: record.description,
      productName: record.productName,
      dosage: record.dosage,
    })),
  )
}

export async function previewGrazingImport(
  organizationId: string,
  sheet: SpreadsheetSheet,
  mapping: ColumnMapping,
): Promise<ImportPreviewRow<GrazingImportRecord>[]> {
  const [pastures, existingPeriods] = await Promise.all([
    database
      .get<Pasture>("pastures")
      .query(Q.where("organization_id", organizationId), Q.where("is_deleted", false))
      .fetch(),
    database
      .get<GrazingPeriod>("grazing_periods")
      .query(Q.where("organization_id", organizationId), Q.where("is_deleted", false))
      .fetch(),
  ])

  return validateGrazingImport(
    sheet.rows,
    mapping,
    pastures.map((pasture) => ({
      id: pasture.id,
      name: pasture.name,
      code: pasture.code,
    })),
    existingPeriods.map((period) => ({
      pastureId: period.pastureId,
      startDate: period.startDate,
      endDate: period.endDate,
      herdGroup: period.herdGroup,
    })),
  )
}

function prepareImportBatch(
  type: DataImportType,
  recordIds: string[],
  options: ExecuteImportOptions,
): DataImportBatch {
  const now = new Date()
  return database.get<DataImportBatch>("data_import_batches").prepareCreate((batch) => {
    batch.organizationId = options.organizationId
    batch.importType = type
    batch.fileName = options.fileName
    batch.sheetName = options.sheetName || null
    batch.totalRows = options.totalRows
    batch.importedRows = recordIds.length
    batch.skippedRows = Math.max(0, options.totalRows - recordIds.length)
    batch.recordIdsJson = JSON.stringify(recordIds)
    batch.status = "completed"
    batch.importedAt = now
    batch.undoneAt = null
    batch.createdByUserId = options.userId ?? null
    batch.createdByName = options.userName ?? null
    batch.updatedAt = now
    batch.isDeleted = false
  })
}

export async function executeTreatmentImport(
  rows: TreatmentImportRecord[],
  options: ExecuteImportOptions,
): Promise<ImportExecutionResult> {
  const now = new Date()
  const records = rows.map((row) =>
    database.get<HealthRecord>("health_records").prepareCreate((record) => {
      record.organizationId = options.organizationId
      record.animalId = row.animalId
      record.protocolId = null
      record.recordDate = row.recordDate
      record.recordType = row.recordType
      record.description = row.description
      record.productName = row.productName ?? null
      record.dosage = row.dosage ?? null
      record.administeredBy = row.administeredBy ?? null
      record.withdrawalDate = row.withdrawalDate ?? null
      record.notes = row.notes ?? null
      record.photos = null
      record.createdByUserId = options.userId ?? null
      record.createdByName = options.userName ?? null
      record.updatedAt = now
      record.isDeleted = false
    }),
  )
  const batch = prepareImportBatch(
    "treatments",
    records.map((record) => record.id),
    options,
  )

  await database.write(async () => {
    await database.batch(...records, batch)
  })

  return {
    batchId: batch.id,
    importedRows: records.length,
    skippedRows: batch.skippedRows,
  }
}

function addAnimalReference(
  lookup: Map<string, Map<string, Animal>>,
  reference: string | null | undefined,
  animal: Animal,
): void {
  const key = normalizeReference(reference)
  if (!key) return
  const matches = lookup.get(key) ?? new Map<string, Animal>()
  matches.set(animal.id, animal)
  lookup.set(key, matches)
}

function resolveAnimalReference(
  lookup: Map<string, Map<string, Animal>>,
  reference: string | undefined,
  selfId: string,
): Animal | null {
  const key = normalizeReference(reference)
  if (!key || ["BULL", "COW", "NA", "N/A", "NONE", "UNKNOWN", "UNK"].includes(key)) {
    return null
  }
  const matches = [...(lookup.get(key)?.values() ?? [])].filter((animal) => animal.id !== selfId)
  return matches.length === 1 ? matches[0] : null
}

export async function executeAnimalImport(
  rows: AnimalImportRecord[],
  options: ExecuteAnimalImportOptions,
): Promise<ImportExecutionResult> {
  const animalsCollection = database.get<Animal>("animals")
  const existingAnimals = await animalsCollection
    .query(Q.where("organization_id", options.organizationId), Q.where("is_deleted", false))
    .fetch()

  if (Number.isFinite(options.animalLimit)) {
    const available = Math.max(0, options.animalLimit - existingAnimals.length)
    if (rows.length > available) {
      throw new AnimalImportLimitError(options.animalLimit, available)
    }
  }

  const now = new Date()
  const records = rows.map((row) =>
    animalsCollection.prepareCreate((animal) => {
      animal.organizationId = options.organizationId
      animal.species = row.species
      animal.rfidTag = row.rfidTag
      animal.visualTag = row.visualTag
      animal.name = row.name ?? null
      animal.breed = row.breed
      animal.sex = row.sex
      animal.dateOfBirth = row.dateOfBirth ?? null
      animal.sireId = null
      animal.damId = null
      animal.externalSireReference = row.sireReference ?? null
      animal.externalSireBreed = row.sireBreed ?? null
      animal.externalDamReference = row.damReference ?? null
      animal.externalDamBreed = row.damBreed ?? null
      animal.sourceName = row.sourceName ?? null
      animal.registrationNumber = row.registrationNumber ?? null
      animal.currentPastureId = null
      animal.status = row.status
      animal.vaccinationHistory = row.vaccinationHistory ?? "unknown"
      animal.vaccinationsUpToDate = animal.vaccinationHistory !== "needs_review"
      animal.herdTag = row.herdTag ?? null
      animal.notes = row.notes ?? null
      animal.photos = null
      animal.tags = row.tags.length > 0 ? JSON.stringify(row.tags) : null
      animal.geneticTraits = null
      animal.updatedAt = now
      animal.isDeleted = false
    }),
  )
  const batch = prepareImportBatch(
    "animals",
    records.map((record) => record.id),
    options,
  )

  await database.write(async () => {
    await database.batch(...records, batch)
  })

  // Imported parents can only be linked once WatermelonDB has assigned and saved
  // every record. This second, best-effort batch also links to animals that were
  // already in the herd. Ambiguous and missing references remain available as
  // structured external parent details rather than being discarded.
  try {
    const referenceLookup = new Map<string, Map<string, Animal>>()
    ;[...existingAnimals, ...records].forEach((animal) => {
      addAnimalReference(referenceLookup, animal.visualTag, animal)
      addAnimalReference(referenceLookup, animal.rfidTag, animal)
      addAnimalReference(referenceLookup, animal.name, animal)
    })

    const parentUpdates = records.flatMap((animal, index) => {
      const row = rows[index]
      const sire = resolveAnimalReference(referenceLookup, row.sireReference, animal.id)
      const dam = resolveAnimalReference(referenceLookup, row.damReference, animal.id)
      if (
        !row.sireReference &&
        !row.sireBreed &&
        !row.damReference &&
        !row.damBreed
      ) {
        return []
      }
      return [
        animal.prepareUpdate((item) => {
          item.sireId = sire?.id ?? null
          item.damId = dam?.id ?? null
          item.externalSireReference = sire ? null : row.sireReference ?? null
          item.externalSireBreed = sire ? null : row.sireBreed ?? null
          item.externalDamReference = dam ? null : row.damReference ?? null
          item.externalDamBreed = dam ? null : row.damBreed ?? null
          item.updatedAt = new Date()
        }),
      ]
    })

    if (parentUpdates.length > 0) {
      await database.write(async () => {
        await database.batch(...parentUpdates)
      })
    }
  } catch (error) {
    console.warn("[DataImport] Animals imported, but some parent links could not be saved:", error)
  }

  calculateScheduledVaccinations(options.organizationId).catch((error) => {
    console.error("[DataImport] Failed to calculate vaccinations after animal import:", error)
  })

  return {
    batchId: batch.id,
    importedRows: records.length,
    skippedRows: batch.skippedRows,
  }
}

export async function executeGrazingImport(
  rows: GrazingImportRecord[],
  options: ExecuteImportOptions,
): Promise<ImportExecutionResult> {
  const now = new Date()
  const records = rows.map((row) =>
    database.get<GrazingPeriod>("grazing_periods").prepareCreate((period) => {
      period.organizationId = options.organizationId
      period.pastureId = row.pastureId
      period.startDate = row.startDate
      period.endDate = row.endDate ?? null
      period.herdGroup = row.herdGroup ?? null
      period.animalCount = row.animalCount ?? null
      period.notes = row.notes ?? null
      period.sourceFileName = options.fileName
      period.createdByUserId = options.userId ?? null
      period.createdByName = options.userName ?? null
      period.updatedAt = now
      period.isDeleted = false
    }),
  )
  const batch = prepareImportBatch(
    "grazing",
    records.map((record) => record.id),
    options,
  )

  await database.write(async () => {
    await database.batch(...records, batch)
  })

  return {
    batchId: batch.id,
    importedRows: records.length,
    skippedRows: batch.skippedRows,
  }
}

export async function getDataImportBatches(organizationId: string): Promise<DataImportBatch[]> {
  return database
    .get<DataImportBatch>("data_import_batches")
    .query(
      Q.where("organization_id", organizationId),
      Q.where("is_deleted", false),
      Q.sortBy("imported_at", Q.desc),
    )
    .fetch()
}

export async function undoDataImport(batchId: string): Promise<void> {
  const batch = await database.get<DataImportBatch>("data_import_batches").find(batchId)
  if (batch.status === "undone") return

  await database.write(async () => {
    const now = new Date()
    for (const recordId of batch.recordIds) {
      try {
        if (batch.importType === "animals") {
          const record = await database.get<Animal>("animals").find(recordId)
          await record.update((item) => {
            item.isDeleted = true
            item.updatedAt = now
          })
        } else if (batch.importType === "treatments") {
          const record = await database.get<HealthRecord>("health_records").find(recordId)
          await record.update((item) => {
            item.isDeleted = true
            item.updatedAt = now
          })
        } else {
          const record = await database.get<GrazingPeriod>("grazing_periods").find(recordId)
          await record.update((item) => {
            item.isDeleted = true
            item.updatedAt = now
          })
        }
      } catch {
        // A missing record should not prevent the rest of the batch from being undone.
      }
    }

    await batch.update((item) => {
      item.status = "undone"
      item.undoneAt = now
      item.updatedAt = now
    })
  })
}
