/**
 * Pure report-config types, constants and grouping math. Runtime-dependency
 * free on purpose: this module is shared by the DB model layer, the report
 * engine and unit tests, and keeping it import-free avoids an import cycle
 * (db -> models -> engine -> db) and lets jest run it without native modules.
 */
import type { Animal } from "@/db/models/Animal"

export type ReportGroupByField = "breed" | "sex" | "age_bracket" | "pasture" | "status" | "tag"

export type ReportSectionKey = "health" | "weights" | "breeding" | "movements"

export type AnimalColumnKey =
  | "visualTag"
  | "rfidTag"
  | "name"
  | "breed"
  | "sex"
  | "age"
  | "status"
  | "herdTag"
  | "latestWeight"
  | "tags"

export interface ReportFilters {
  species: string | null
  breeds: string[]
  sexes: string[]
  statuses: string[]
  ageFromMonths: number | null
  ageToMonths: number | null
  tags: string[]
  pastureIds: string[]
}

export interface ReportConfig {
  filters: ReportFilters
  groupBy: ReportGroupByField | null
  columns: AnimalColumnKey[]
  sections: ReportSectionKey[]
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  species: null,
  breeds: [],
  sexes: [],
  statuses: [],
  ageFromMonths: null,
  ageToMonths: null,
  tags: [],
  pastureIds: [],
}

export const DEFAULT_REPORT_COLUMNS: AnimalColumnKey[] = [
  "visualTag",
  "name",
  "breed",
  "sex",
  "age",
  "status",
]

export const ALL_ANIMAL_COLUMNS: AnimalColumnKey[] = [
  "visualTag",
  "rfidTag",
  "name",
  "breed",
  "sex",
  "age",
  "status",
  "herdTag",
  "latestWeight",
  "tags",
]

export const ALL_REPORT_SECTIONS: ReportSectionKey[] = [
  "health",
  "weights",
  "breeding",
  "movements",
]

export const ALL_GROUP_BY_FIELDS: ReportGroupByField[] = [
  "breed",
  "sex",
  "age_bracket",
  "pasture",
  "status",
  "tag",
]

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  filters: DEFAULT_REPORT_FILTERS,
  groupBy: null,
  columns: DEFAULT_REPORT_COLUMNS,
  sections: [],
}

/** Age bracket keys, ordered youngest to oldest. Labels are i18n'd by callers. */
export const AGE_BRACKETS = ["under_6m", "6_12m", "1_2y", "2_5y", "over_5y", "unknown"] as const
export type AgeBracketKey = (typeof AGE_BRACKETS)[number]

const AVG_DAYS_PER_MONTH = 30.44

export function ageInMonths(dateOfBirth: Date | null, now: number = Date.now()): number | null {
  if (!dateOfBirth) return null
  const months = Math.floor(
    (now - dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * AVG_DAYS_PER_MONTH),
  )
  return months < 0 ? 0 : months
}

export function ageBracketForMonths(months: number | null): AgeBracketKey {
  if (months === null) return "unknown"
  if (months < 6) return "under_6m"
  if (months < 12) return "6_12m"
  if (months < 24) return "1_2y"
  if (months < 60) return "2_5y"
  return "over_5y"
}

export interface ReportRow {
  animal: Animal
  ageMonths: number | null
  latestWeightKg: number | null
  pastureName: string | null
}

export interface ReportGroup {
  /** Raw grouping value ("Nguni", "female", "6_12m", a pasture id, ...). */
  key: string
  rows: ReportRow[]
}

/**
 * Group animals by the configured field. Animals with no value land in the
 * "unknown" group ("" key), except tag grouping where an animal appears once
 * per tag it carries.
 */
export function groupAnimals(rows: ReportRow[], groupBy: ReportGroupByField | null): ReportGroup[] {
  if (!groupBy) return [{ key: "", rows }]

  const groups = new Map<string, ReportRow[]>()
  const push = (key: string, row: ReportRow) => {
    const list = groups.get(key)
    if (list) list.push(row)
    else groups.set(key, [row])
  }

  for (const row of rows) {
    const { animal } = row
    switch (groupBy) {
      case "breed":
        push(animal.breed || "", row)
        break
      case "sex":
        push(animal.sex || "", row)
        break
      case "status":
        push(animal.status || "", row)
        break
      case "age_bracket":
        push(ageBracketForMonths(row.ageMonths), row)
        break
      case "pasture":
        push(animal.currentPastureId || "", row)
        break
      case "tag": {
        const tags = animal.tagsList
        if (tags.length === 0) push("", row)
        else for (const tag of tags) push(tag, row)
        break
      }
    }
  }

  const result = Array.from(groups.entries()).map(([key, groupRows]) => ({ key, rows: groupRows }))

  if (groupBy === "age_bracket") {
    const order = new Map<string, number>(AGE_BRACKETS.map((b, i) => [b as string, i]))
    result.sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99))
  } else {
    // Biggest groups first, unknown ("") last
    result.sort((a, b) => {
      if (a.key === "") return 1
      if (b.key === "") return -1
      return b.rows.length - a.rows.length
    })
  }

  return result
}

/** Serialize a config for navigation params / template storage. */
export function serializeReportConfig(config: ReportConfig): string {
  return JSON.stringify(config)
}

export function parseReportConfig(serialized: string): ReportConfig {
  const parsed = JSON.parse(serialized) as Partial<ReportConfig>
  return {
    filters: { ...DEFAULT_REPORT_FILTERS, ...(parsed.filters ?? {}) },
    groupBy: parsed.groupBy ?? null,
    columns: parsed.columns && parsed.columns.length > 0 ? parsed.columns : DEFAULT_REPORT_COLUMNS,
    sections: parsed.sections ?? [],
  }
}
