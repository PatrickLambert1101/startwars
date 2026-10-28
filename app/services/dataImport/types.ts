import type { HealthRecordType } from "@/db/models"
import type { AnimalSex, AnimalSpecies, AnimalStatus } from "@/db/models/Animal"

export type DataImportType = "animals" | "treatments" | "grazing"

export type SpreadsheetCell = string | number | boolean | Date | null

export interface SpreadsheetRow {
  rowNumber: number
  values: SpreadsheetCell[]
}

export interface SpreadsheetSheet {
  name: string
  headers: string[]
  rows: SpreadsheetRow[]
}

export interface ParsedSpreadsheet {
  fileName: string
  sheets: SpreadsheetSheet[]
}

export interface ImportFieldDefinition {
  key: string
  label: string
  required: boolean
  dataType: string
  help: string
  example: string
  aliases: string[]
}

export type ColumnMapping = Record<string, number | null>

export type ImportIssueSeverity = "warning" | "error"

export interface ImportIssue {
  severity: ImportIssueSeverity
  code: string
  message: string
}

export interface TreatmentImportRecord {
  rowNumber: number
  animalId: string
  animalLabel: string
  recordDate: Date
  recordType: HealthRecordType
  description: string
  productName?: string
  dosage?: string
  administeredBy?: string
  withdrawalDate?: Date
  notes?: string
}

export interface GrazingImportRecord {
  rowNumber: number
  pastureId: string
  pastureLabel: string
  startDate: Date
  endDate?: Date
  herdGroup?: string
  animalCount?: number
  notes?: string
}

export interface AnimalImportRecord {
  rowNumber: number
  visualTag: string
  rfidTag: string
  name?: string
  species: AnimalSpecies
  breed: string
  sex: AnimalSex
  dateOfBirth?: Date
  status: AnimalStatus
  vaccinationsUpToDate: boolean
  vaccinationHistory?: "current" | "needs_review" | "unknown"
  registrationNumber?: string
  herdTag?: string
  notes?: string
  tags: string[]
  sireReference?: string
  sireBreed?: string
  damReference?: string
  damBreed?: string
  sourceName?: string
}

export interface AnimalImportSettings {
  breed?: string
  sex?: AnimalSex
  tags?: string[]
}

export interface ImportPreviewRow<T> {
  rowNumber: number
  sourceLabel: string
  detail: string
  record?: T
  issues: ImportIssue[]
  canImport: boolean
}

export interface ImportExecutionResult {
  batchId: string
  importedRows: number
  skippedRows: number
}
