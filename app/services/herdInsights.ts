import { Q } from "@nozbe/watermelondb"

import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { BreedingRecord } from "@/db/models/BreedingRecord"
import { HealthRecord } from "@/db/models/HealthRecord"
import { Pasture } from "@/db/models/Pasture"
import { PastureActivity } from "@/db/models/PastureActivity"
import { ScheduledVaccination } from "@/db/models/ScheduledVaccination"
import { WeightRecord } from "@/db/models/WeightRecord"
import { supabase } from "@/services/supabase"

export type HerdInsightPriority = "high" | "medium" | "low"

export type HerdInsightItem = {
  priority: HerdInsightPriority
  title: string
  reason: string
  action: string
}

export type HerdInsightsResult = {
  summary: string
  insights: HerdInsightItem[]
  generatedAt: string
  cached: boolean
  remainingToday: number
}

type WeightTrend = {
  animal: string
  latestKg: number
  previousKg: number
  changePercent: number
  daysBetween: number
}

export type HerdInsightSnapshot = {
  generatedAt: string
  herd: {
    activeAnimals: number
    unassignedAnimals: number
    species: Record<string, number>
    sexes: Record<string, number>
  }
  pastureSummary: Array<{
    name: string
    sizeHectares: number | null
    animals: number
    maxCapacity: number | null
    forageType: string | null
    waterSource: string | null
    hasSaltBlocks: boolean | null
    hasMineralFeeders: boolean | null
    daysGrazed: number
    targetGrazingDays: number | null
    availableFrom: string | null
    latestTickLoad: number | null
  }>
  animalHealth: {
    treatmentsLast90Days: number
    vetVisitsLast90Days: number
    conditionChecksLast90Days: number
    weightLossSignals: WeightTrend[]
  }
  breeding: {
    pending: number
    calvingsDueWithin60Days: number
    overdueCalvings: number
  }
  vaccinations: {
    overdue: number
    dueWithin7Days: number
    pendingLater: number
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function animalLabel(animal: Animal | undefined): string {
  if (!animal) return "Unknown animal"
  return animal.visualTag || animal.rfidTag || animal.name || animal.id
}

export async function buildHerdInsightSnapshot(
  organizationId: string,
): Promise<HerdInsightSnapshot> {
  const now = new Date()
  const ninetyDaysAgo = now.getTime() - 90 * DAY_MS
  const sixtyDaysFromNow = now.getTime() + 60 * DAY_MS
  const sevenDaysFromNow = now.getTime() + 7 * DAY_MS
  const org = Q.where("organization_id", organizationId)
  const active = Q.where("is_deleted", false)

  const [animals, pastures, health, weights, breeding, vaccinations, pastureActivities] =
    await Promise.all([
      database.get<Animal>("animals").query(org, active, Q.where("status", "active")).fetch(),
      database.get<Pasture>("pastures").query(org, active, Q.where("is_active", true)).fetch(),
      database
        .get<HealthRecord>("health_records")
        .query(org, active, Q.where("record_date", Q.gte(ninetyDaysAgo)))
        .fetch(),
      database.get<WeightRecord>("weight_records").query(org, active).fetch(),
      database
        .get<BreedingRecord>("breeding_records")
        .query(org, active, Q.where("outcome", "pending"))
        .fetch(),
      database
        .get<ScheduledVaccination>("scheduled_vaccinations")
        .query(org, active, Q.where("status", "pending"))
        .fetch(),
      database
        .get<PastureActivity>("pasture_activities")
        .query(org, active, Q.where("activity_date", Q.gte(ninetyDaysAgo)))
        .fetch(),
    ])

  const animalById = new Map(animals.map((animal) => [animal.id, animal]))
  const animalsByPasture = countBy(
    animals.flatMap((animal) => (animal.currentPastureId ? [animal.currentPastureId] : [])),
  )

  const latestTickByPasture = new Map<string, PastureActivity>()
  for (const activity of pastureActivities) {
    if (activity.activityType !== "tick_observation") continue
    const current = latestTickByPasture.get(activity.pastureId)
    if (!current || activity.activityDate > current.activityDate) {
      latestTickByPasture.set(activity.pastureId, activity)
    }
  }

  const weightsByAnimal = new Map<string, WeightRecord[]>()
  for (const weight of weights) {
    if (!animalById.has(weight.animalId)) continue
    const records = weightsByAnimal.get(weight.animalId) ?? []
    records.push(weight)
    weightsByAnimal.set(weight.animalId, records)
  }

  const weightLossSignals: WeightTrend[] = []
  for (const [animalId, records] of weightsByAnimal) {
    if (records.length < 2) continue
    records.sort((left, right) => right.recordDate.getTime() - left.recordDate.getTime())
    const [latest, previous] = records
    if (previous.weightKg <= 0 || latest.weightKg >= previous.weightKg) continue
    const changePercent = ((latest.weightKg - previous.weightKg) / previous.weightKg) * 100
    if (changePercent > -3) continue
    weightLossSignals.push({
      animal: animalLabel(animalById.get(animalId)),
      latestKg: Math.round(latest.weightKg * 10) / 10,
      previousKg: Math.round(previous.weightKg * 10) / 10,
      changePercent: Math.round(changePercent * 10) / 10,
      daysBetween: Math.max(
        1,
        Math.round((latest.recordDate.getTime() - previous.recordDate.getTime()) / DAY_MS),
      ),
    })
  }
  weightLossSignals.sort((left, right) => left.changePercent - right.changePercent)

  const overdueCalvings = breeding.filter(
    (record) => record.expectedCalvingDate && record.expectedCalvingDate.getTime() < now.getTime(),
  ).length
  const calvingsDueWithin60Days = breeding.filter(
    (record) =>
      record.expectedCalvingDate &&
      record.expectedCalvingDate.getTime() >= now.getTime() &&
      record.expectedCalvingDate.getTime() <= sixtyDaysFromNow,
  ).length

  const overdueVaccinations = vaccinations.filter(
    (vaccination) => vaccination.dueDate.getTime() < now.getTime(),
  ).length
  const vaccinationsDueWithin7Days = vaccinations.filter(
    (vaccination) =>
      vaccination.dueDate.getTime() >= now.getTime() &&
      vaccination.dueDate.getTime() <= sevenDaysFromNow,
  ).length

  return {
    generatedAt: now.toISOString(),
    herd: {
      activeAnimals: animals.length,
      unassignedAnimals: animals.filter((animal) => !animal.currentPastureId).length,
      species: countBy(animals.map((animal) => animal.species)),
      sexes: countBy(animals.map((animal) => animal.sex)),
    },
    pastureSummary: pastures.map((pasture) => ({
      name: pasture.name,
      sizeHectares: pasture.sizeHectares,
      animals: animalsByPasture[pasture.id] ?? 0,
      maxCapacity: pasture.maxCapacity,
      forageType: pasture.forageType,
      waterSource: pasture.waterSource,
      hasSaltBlocks: pasture.hasSaltBlocks,
      hasMineralFeeders: pasture.hasMineralFeeders,
      daysGrazed: pasture.daysGrazed,
      targetGrazingDays: pasture.targetGrazingDays,
      availableFrom: pasture.availableFromDate?.toISOString() ?? null,
      latestTickLoad: latestTickByPasture.get(pasture.id)?.tickLoadScore ?? null,
    })),
    animalHealth: {
      treatmentsLast90Days: health.filter((record) => record.recordType === "treatment").length,
      vetVisitsLast90Days: health.filter((record) => record.recordType === "vet_visit").length,
      conditionChecksLast90Days: health.filter((record) => record.recordType === "condition_score")
        .length,
      weightLossSignals: weightLossSignals.slice(0, 10),
    },
    breeding: {
      pending: breeding.length,
      calvingsDueWithin60Days,
      overdueCalvings,
    },
    vaccinations: {
      overdue: overdueVaccinations,
      dueWithin7Days: vaccinationsDueWithin7Days,
      pendingLater: Math.max(
        0,
        vaccinations.length - overdueVaccinations - vaccinationsDueWithin7Days,
      ),
    },
  }
}

export async function generateHerdInsights(organizationId: string): Promise<HerdInsightsResult> {
  const snapshot = await buildHerdInsightSnapshot(organizationId)
  const { data, error } = await supabase.functions.invoke("herd-insights", {
    body: { organizationId, snapshot },
  })

  if (error) throw new Error(error.message || "Could not generate herd insights")
  if (!data?.summary || !Array.isArray(data?.insights)) {
    throw new Error("The insight service returned an invalid response")
  }

  return data as HerdInsightsResult
}
