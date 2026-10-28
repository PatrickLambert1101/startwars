import { format } from "date-fns"

import type { BreedingMethod, BreedingOutcome } from "@/db/models/BreedingRecord"
import type { HealthRecordType } from "@/db/models/HealthRecord"
import { PASTURE_ACTIVITY_LABELS, type PastureActivityType } from "@/db/models/PastureActivity"
import type { MovementType } from "@/db/models/PastureMovement"

export type DashboardActivityKind = "health" | "breeding" | "movement" | "pasture"

export interface DashboardActivityItem {
  id: string
  kind: DashboardActivityKind
  occurredAt: Date
  title: string
  detail?: string
  animalId?: string
  pastureId?: string
  animalTab?: "health" | "vaccinations" | "breeding"
}

interface HealthActivitySource {
  id: string
  animalId: string
  recordDate: Date
  recordType: HealthRecordType
  description: string
  productName: string | null
}

interface BreedingActivitySource {
  id: string
  animalId: string
  breedingDate: Date
  method: BreedingMethod
  outcome: BreedingOutcome
  expectedCalvingDate: Date | null
}

interface MovementActivitySource {
  id: string
  pastureId: string
  animalId: string
  movementDate: Date
  movementType: MovementType
  notes: string | null
}

interface PastureActivitySource {
  id: string
  pastureId: string
  activityDate: Date
  activityType: PastureActivityType
  notes: string | null
  tickLoadScore: number | null
  animalsInspected: number | null
}

interface BuildDashboardActivityInput {
  healthRecords: HealthActivitySource[]
  breedingRecords: BreedingActivitySource[]
  pastureMovements: MovementActivitySource[]
  pastureActivities: PastureActivitySource[]
  animalNames: ReadonlyMap<string, string>
  pastureNames: ReadonlyMap<string, string>
  limit?: number
}

const HEALTH_LABELS: Record<HealthRecordType, string> = {
  vaccination: "Vaccination",
  treatment: "Treatment",
  vet_visit: "Vet visit",
  condition_score: "Condition score",
  other: "Health note",
}

const BREEDING_METHOD_LABELS: Record<BreedingMethod, string> = {
  natural: "Natural service",
  ai: "Artificial insemination",
  embryo_transfer: "Embryo transfer",
}

const BREEDING_OUTCOME_LABELS: Record<BreedingOutcome, string> = {
  pending: "Pending",
  live_calf: "Live calf",
  stillborn: "Stillborn",
  aborted: "Aborted",
  open: "Open",
}

function animalName(animalNames: ReadonlyMap<string, string>, animalId: string): string {
  return animalNames.get(animalId) ?? "Unknown animal"
}

function pastureName(pastureNames: ReadonlyMap<string, string>, pastureId: string): string {
  return pastureNames.get(pastureId) ?? "Unknown pasture"
}

/**
 * Combines farm records into a short, chronological operational feed.
 * Movement rows created together are grouped so moving a large herd does not
 * overwhelm every other kind of activity.
 */
export function buildDashboardActivity({
  healthRecords,
  breedingRecords,
  pastureMovements,
  pastureActivities,
  animalNames,
  pastureNames,
  limit = 6,
}: BuildDashboardActivityInput): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = healthRecords.map((record) => ({
    id: `health:${record.id}`,
    kind: "health",
    occurredAt: record.recordDate,
    title: `${HEALTH_LABELS[record.recordType]} · ${animalName(animalNames, record.animalId)}`,
    detail: record.productName || record.description || undefined,
    animalId: record.animalId,
    animalTab: record.recordType === "vaccination" ? "vaccinations" : "health",
  }))

  for (const record of breedingRecords) {
    const expected =
      record.outcome === "pending" && record.expectedCalvingDate
        ? ` · Expected ${format(record.expectedCalvingDate, "dd MMM yyyy")}`
        : ""
    items.push({
      id: `breeding:${record.id}`,
      kind: "breeding",
      occurredAt: record.breedingDate,
      title: `Breeding · ${animalName(animalNames, record.animalId)}`,
      detail: `${BREEDING_METHOD_LABELS[record.method]} · ${BREEDING_OUTCOME_LABELS[record.outcome]}${expected}`,
      animalId: record.animalId,
      animalTab: "breeding",
    })
  }

  const movementGroups = new Map<
    string,
    { records: MovementActivitySource[]; latest: MovementActivitySource }
  >()
  for (const movement of pastureMovements) {
    const minute = Math.floor(movement.movementDate.getTime() / 60_000)
    const key = `${movement.movementType}:${movement.pastureId}:${minute}`
    const existing = movementGroups.get(key)
    if (existing) {
      existing.records.push(movement)
      if (movement.movementDate > existing.latest.movementDate) existing.latest = movement
    } else {
      movementGroups.set(key, { records: [movement], latest: movement })
    }
  }

  for (const group of movementGroups.values()) {
    const { records, latest } = group
    const direction = latest.movementType === "move_in" ? "into" : "out of"
    const countLabel =
      records.length === 1 ? animalName(animalNames, latest.animalId) : `${records.length} animals`
    items.push({
      id: `movement:${latest.id}`,
      kind: "movement",
      occurredAt: latest.movementDate,
      title: `Moved ${countLabel} ${direction} ${pastureName(pastureNames, latest.pastureId)}`,
      detail: latest.notes || undefined,
      pastureId: latest.pastureId,
    })
  }

  for (const activity of pastureActivities) {
    const tickDetail =
      activity.activityType === "tick_observation" && activity.tickLoadScore !== null
        ? `Tick load ${activity.tickLoadScore}/5${
            activity.animalsInspected ? ` · ${activity.animalsInspected} inspected` : ""
          }`
        : undefined
    items.push({
      id: `pasture:${activity.id}`,
      kind: "pasture",
      occurredAt: activity.activityDate,
      title: `${PASTURE_ACTIVITY_LABELS[activity.activityType]} · ${pastureName(
        pastureNames,
        activity.pastureId,
      )}`,
      detail: tickDetail || activity.notes || undefined,
      pastureId: activity.pastureId,
    })
  }

  return items
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
    .slice(0, limit)
}
