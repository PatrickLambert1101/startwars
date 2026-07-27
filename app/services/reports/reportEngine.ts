import { Q } from "@nozbe/watermelondb"

import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { BreedingRecord } from "@/db/models/BreedingRecord"
import { HealthRecord } from "@/db/models/HealthRecord"
import { Pasture } from "@/db/models/Pasture"
import { PastureMovement } from "@/db/models/PastureMovement"
import { WeightRecord } from "@/db/models/WeightRecord"

import type { ReportConfig, ReportFilters, ReportGroup, ReportRow } from "./reportConfig"
import { ageInMonths, groupAnimals } from "./reportConfig"

/**
 * The report engine turns a serializable ReportConfig into grouped animal rows
 * plus (optionally) each animal's history records. It is the single source of
 * truth for custom reports: the viewer screen, PDF, xlsx and CSV exports all
 * render from the same ReportResult.
 *
 * Config types/constants live in reportConfig.ts (dependency-free, shared
 * with the ReportTemplate model); everything is re-exported here for callers.
 */
export * from "./reportConfig"

export interface ReportRelatedRecords {
  health: Map<string, HealthRecord[]>
  weights: Map<string, WeightRecord[]>
  breeding: Map<string, BreedingRecord[]>
  movements: Map<string, PastureMovement[]>
}

export interface ReportResult {
  config: ReportConfig
  totalCount: number
  groups: ReportGroup[]
  related: ReportRelatedRecords
  /** pasture id -> display name, for pasture group labels and columns */
  pastureNames: Map<string, string>
}

/**
 * DB-level clauses for a report's filters. Age and tag filters are computed
 * fields (JSON / date math) and are applied in-memory by applyComputedFilters.
 */
export function buildAnimalClauses(organizationId: string, filters: ReportFilters): Q.Clause[] {
  const clauses: Q.Clause[] = [
    Q.where("organization_id", organizationId),
    Q.where("is_deleted", false),
  ]
  if (filters.species) clauses.push(Q.where("species", filters.species))
  if (filters.breeds.length > 0) clauses.push(Q.where("breed", Q.oneOf(filters.breeds)))
  if (filters.sexes.length > 0) clauses.push(Q.where("sex", Q.oneOf(filters.sexes)))
  if (filters.statuses.length > 0) clauses.push(Q.where("status", Q.oneOf(filters.statuses)))
  if (filters.pastureIds.length > 0)
    clauses.push(Q.where("current_pasture_id", Q.oneOf(filters.pastureIds)))
  return clauses
}

export function applyComputedFilters(
  animals: Animal[],
  filters: ReportFilters,
  now: number = Date.now(),
): Animal[] {
  let result = animals

  if (filters.ageFromMonths !== null || filters.ageToMonths !== null) {
    result = result.filter((a) => {
      const months = ageInMonths(a.dateOfBirth, now)
      if (months === null) return false
      if (filters.ageFromMonths !== null && months < filters.ageFromMonths) return false
      if (filters.ageToMonths !== null && months > filters.ageToMonths) return false
      return true
    })
  }

  if (filters.tags.length > 0) {
    const wanted = filters.tags.map((t) => t.toLowerCase())
    result = result.filter((a) => {
      const tagList = a.tagsList.map((t) => t.toLowerCase())
      return wanted.some((w) => tagList.includes(w))
    })
  }

  return result
}

/** SQLite caps bound variables (~999); stay comfortably under it. */
const ID_CHUNK_SIZE = 900

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

async function fetchByAnimalIds<T extends { animalId: string }>(
  table: string,
  animalIds: string[],
  sortColumn: string,
): Promise<Map<string, T[]>> {
  const byAnimal = new Map<string, T[]>()
  for (const ids of chunk(animalIds, ID_CHUNK_SIZE)) {
    const records = (await database
      .get(table)
      .query(
        Q.where("animal_id", Q.oneOf(ids)),
        Q.where("is_deleted", false),
        Q.sortBy(sortColumn, Q.desc),
      )
      .fetch()) as unknown as T[]
    for (const record of records) {
      const list = byAnimal.get(record.animalId)
      if (list) list.push(record)
      else byAnimal.set(record.animalId, [record])
    }
  }
  return byAnimal
}

/**
 * Run a report config against the local database. Pure data — all labels and
 * formatting happen at the rendering layer (screen / PDF / xlsx / CSV).
 */
export async function runReport(
  organizationId: string,
  config: ReportConfig,
): Promise<ReportResult> {
  const animals = await database
    .get<Animal>("animals")
    .query(...buildAnimalClauses(organizationId, config.filters), Q.sortBy("visual_tag", Q.asc))
    .fetch()

  const filtered = applyComputedFilters(animals, config.filters)
  const animalIds = filtered.map((a) => a.id)

  const needsWeights =
    config.sections.includes("weights") || config.columns.includes("latestWeight")

  const [health, weights, breeding, movements, pastures] = await Promise.all([
    config.sections.includes("health")
      ? fetchByAnimalIds<HealthRecord>("health_records", animalIds, "record_date")
      : Promise.resolve(new Map<string, HealthRecord[]>()),
    needsWeights
      ? fetchByAnimalIds<WeightRecord>("weight_records", animalIds, "record_date")
      : Promise.resolve(new Map<string, WeightRecord[]>()),
    config.sections.includes("breeding")
      ? fetchByAnimalIds<BreedingRecord>("breeding_records", animalIds, "breeding_date")
      : Promise.resolve(new Map<string, BreedingRecord[]>()),
    config.sections.includes("movements")
      ? fetchByAnimalIds<PastureMovement>("pasture_movements", animalIds, "movement_date")
      : Promise.resolve(new Map<string, PastureMovement[]>()),
    // Pasture names are cheap and used for pasture group labels and the row meta
    database
      .get<Pasture>("pastures")
      .query(Q.where("organization_id", organizationId), Q.where("is_deleted", false))
      .fetch(),
  ])

  const pastureNames = new Map<string, string>()
  for (const pasture of pastures) pastureNames.set(pasture.id, pasture.name)

  const now = Date.now()
  const rows: ReportRow[] = filtered.map((animal) => {
    const animalWeights = weights.get(animal.id)
    return {
      animal,
      ageMonths: ageInMonths(animal.dateOfBirth, now),
      // Records are sorted record_date desc, so the first entry is the latest
      latestWeightKg: animalWeights && animalWeights.length > 0 ? animalWeights[0].weightKg : null,
      pastureName: animal.currentPastureId
        ? (pastureNames.get(animal.currentPastureId) ?? null)
        : null,
    }
  })

  return {
    config,
    totalCount: rows.length,
    groups: groupAnimals(rows, config.groupBy),
    related: { health, weights, breeding, movements },
    pastureNames,
  }
}
