import type { HealthRecordType } from "@/db/models"
import type { AnimalSex, AnimalSpecies, AnimalStatus } from "@/db/models/Animal"

import type { SpreadsheetCell } from "./types"

function validDateParts(year: number, month: number, day: number): Date | null {
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day, 12, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 200_000) return null
  const utc = new Date(Math.round((serial - 25569) * 86_400_000))
  return validDateParts(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate())
}

export function parseImportDate(value: SpreadsheetCell): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : validDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate())
  }

  if (typeof value === "number") return excelSerialToDate(value)

  const text = String(value ?? "").trim()
  if (!text) return null

  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s.*)?$/)
  if (match) {
    return validDateParts(Number(match[1]), Number(match[2]), Number(match[3]))
  }

  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:\s.*)?$/)
  if (match) {
    const yearValue = Number(match[3])
    const year = yearValue < 100 ? 2000 + yearValue : yearValue
    // Day-first is the safe default for South African farm records.
    return validDateParts(year, Number(match[2]), Number(match[1]))
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return null
  return validDateParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate())
}

export function parsePositiveInteger(value: SpreadsheetCell): number | null {
  const text = String(value ?? "").trim()
  if (!text) return null
  const number = typeof value === "number" ? value : Number(text.replace(/\s/g, ""))
  if (!Number.isInteger(number) || number <= 0) return null
  return number
}

export function parseNonNegativeInteger(value: SpreadsheetCell): number | null {
  const text = String(value ?? "").trim()
  if (!text) return null
  const number = typeof value === "number" ? value : Number(text.replace(/\s/g, ""))
  if (!Number.isInteger(number) || number < 0) return null
  return number
}

export function normalizeReference(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase()
    .replace(/\s+/g, "")
}

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseHealthRecordType(value: SpreadsheetCell): HealthRecordType {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, "_")
    .replace(/^_|_$/g, "")

  if (
    ["vaccination", "vaccine", "vaccinated", "immunisation", "immunization"].includes(normalized)
  ) {
    return "vaccination"
  }
  if (["vet", "vet_visit", "veterinary", "veterinary_visit"].includes(normalized)) {
    return "vet_visit"
  }
  if (["condition", "condition_score", "body_condition", "bcs"].includes(normalized)) {
    return "condition_score"
  }
  if (normalized === "other") return "other"
  return "treatment"
}

export interface ParsedImportValue<T> {
  value: T
  recognized: boolean
}

function normalizedWord(value: SpreadsheetCell): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function parseAnimalSpecies(
  value: SpreadsheetCell,
  fallback: AnimalSpecies = "cattle",
): ParsedImportValue<AnimalSpecies> {
  const normalized = normalizedWord(value)
  if (!normalized) return { value: fallback, recognized: true }

  const species: Record<string, AnimalSpecies> = {
    cattle: "cattle",
    cow: "cattle",
    cows: "cattle",
    bovine: "cattle",
    buffalo: "buffalo",
    horse: "horses",
    horses: "horses",
    equine: "horses",
    sheep: "sheep",
    ewe: "sheep",
    goat: "goats",
    goats: "goats",
    game: "game",
    wildlife: "game",
    pig: "pigs",
    pigs: "pigs",
    swine: "pigs",
    poultry: "poultry",
    chicken: "poultry",
    chickens: "poultry",
  }
  return species[normalized]
    ? { value: species[normalized], recognized: true }
    : { value: fallback, recognized: false }
}

export function parseAnimalSex(
  value: SpreadsheetCell,
  fallback: AnimalSex = "unknown",
): ParsedImportValue<AnimalSex> {
  const normalized = normalizedWord(value)
  if (!normalized) return { value: fallback, recognized: true }

  if (
    ["m", "male", "bull", "bull calf", "ram", "buck", "boar", "stallion", "cock"].includes(
      normalized,
    )
  ) {
    return { value: "male", recognized: true }
  }
  if (
    ["f", "female", "cow", "heifer", "heifer calf", "ewe", "doe", "sow", "mare", "hen"].includes(
      normalized,
    )
  ) {
    return { value: "female", recognized: true }
  }
  if (["castrated", "steer", "ox", "wether", "gelding", "barrow", "capon"].includes(normalized)) {
    return { value: "castrated", recognized: true }
  }
  if (["unknown", "unsure", "n a", "na"].includes(normalized)) {
    return { value: "unknown", recognized: true }
  }
  return { value: fallback, recognized: false }
}

export function parseAnimalStatus(
  value: SpreadsheetCell,
  fallback: AnimalStatus = "active",
): ParsedImportValue<AnimalStatus> {
  const normalized = normalizedWord(value)
  if (!normalized) return { value: fallback, recognized: true }

  if (["sold", "sale"].includes(normalized)) return { value: "sold", recognized: true }
  if (["dead", "deceased", "died", "death"].includes(normalized)) {
    return { value: "deceased", recognized: true }
  }
  if (["transferred", "transfer", "moved", "removed"].includes(normalized)) {
    return { value: "transferred", recognized: true }
  }
  if (
    [
      "active",
      "in calf",
      "pregnant",
      "heifer",
      "retained",
      "weaned",
      "on cow",
      "bottle",
      "breeding",
      "in field",
      "in herd",
    ].includes(normalized)
  ) {
    return { value: "active", recognized: true }
  }
  return { value: fallback, recognized: false }
}

export function parseImportBoolean(
  value: SpreadsheetCell,
  fallback: boolean,
): ParsedImportValue<boolean> {
  const normalized = normalizedWord(value)
  if (!normalized) return { value: fallback, recognized: true }
  if (["yes", "y", "true", "1", "current", "up to date"].includes(normalized)) {
    return { value: true, recognized: true }
  }
  if (["no", "n", "false", "0", "not current", "overdue"].includes(normalized)) {
    return { value: false, recognized: true }
  }
  return { value: fallback, recognized: false }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
