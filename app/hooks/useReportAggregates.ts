import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { combineLatest } from "rxjs"
import { auditTime } from "rxjs/operators"

import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { Pasture } from "@/db/models/Pasture"
import { WeightRecord } from "@/db/models/WeightRecord"
import {
  ageBracketForMonths,
  ageInMonths,
  type AgeBracketKey,
} from "@/services/reports/reportEngine"

export interface HerdComposition {
  totalHead: number
  activeCount: number
  byStatus: Record<string, number>
  bySpecies: Record<string, number>
  byBreed: Record<string, number>
  bySex: Record<string, number>
  byAgeBracket: Record<AgeBracketKey, number>
}

export interface WeightTrendPoint {
  /** "2026-03" — used for ordering */
  monthKey: string
  /** Short label for the chart axis, e.g. "Mar" */
  label: string
  avgKg: number
  count: number
}

export interface GrowthStats {
  trend: WeightTrendPoint[]
  /** Herd-level average daily gain in kg/day across animals with 2+ weighings */
  adgKgPerDay: number | null
  latestAvgKg: number | null
  recordCount: number
}

export interface BreedingStats {
  liveCalves: number
  resolvedCount: number
  pendingCount: number
  /** live calves / resolved outcomes, as a 0-100 percentage */
  calvingRatePct: number | null
  byOutcome: Record<string, number>
}

export interface VaccinationStats {
  administered: number
  outstanding: number
  overdue: number
  /** administered / (administered + outstanding), as a 0-100 percentage */
  coveragePct: number | null
}

export interface PastureOccupancy {
  id: string
  name: string
  currentCount: number
  maxCapacity: number | null
  occupancyPct: number
}

export interface ReportAggregates {
  composition: HerdComposition
  growth: GrowthStats
  breeding: BreedingStats
  vaccinations: VaccinationStats
  pastures: PastureOccupancy[]
}

const EMPTY_COMPOSITION: HerdComposition = {
  totalHead: 0,
  activeCount: 0,
  byStatus: {},
  bySpecies: {},
  byBreed: {},
  bySex: {},
  byAgeBracket: { "under_6m": 0, "6_12m": 0, "1_2y": 0, "2_5y": 0, "over_5y": 0, "unknown": 0 },
}

const EMPTY_AGGREGATES: ReportAggregates = {
  composition: EMPTY_COMPOSITION,
  growth: { trend: [], adgKgPerDay: null, latestAvgKg: null, recordCount: 0 },
  breeding: {
    liveCalves: 0,
    resolvedCount: 0,
    pendingCount: 0,
    calvingRatePct: null,
    byOutcome: {},
  },
  vaccinations: { administered: 0, outstanding: 0, overdue: 0, coveragePct: null },
  pastures: [],
}

const WEIGHT_WINDOW_MONTHS = 24
const TREND_MONTHS = 12
const MS_PER_DAY = 1000 * 60 * 60 * 24

function computeComposition(animals: Animal[], now: number): HerdComposition {
  const composition: HerdComposition = {
    ...EMPTY_COMPOSITION,
    byStatus: {},
    bySpecies: {},
    byBreed: {},
    bySex: {},
    byAgeBracket: { "under_6m": 0, "6_12m": 0, "1_2y": 0, "2_5y": 0, "over_5y": 0, "unknown": 0 },
  }
  composition.totalHead = animals.length
  for (const animal of animals) {
    if (animal.status === "active") composition.activeCount += 1
    composition.byStatus[animal.status] = (composition.byStatus[animal.status] || 0) + 1
    composition.bySpecies[animal.species] = (composition.bySpecies[animal.species] || 0) + 1
    if (animal.breed)
      composition.byBreed[animal.breed] = (composition.byBreed[animal.breed] || 0) + 1
    composition.bySex[animal.sex] = (composition.bySex[animal.sex] || 0) + 1
    composition.byAgeBracket[ageBracketForMonths(ageInMonths(animal.dateOfBirth, now))] += 1
  }
  return composition
}

function computeGrowth(records: WeightRecord[], now: number): GrowthStats {
  if (records.length === 0) {
    return { trend: [], adgKgPerDay: null, latestAvgKg: null, recordCount: 0 }
  }

  // Monthly average buckets for the last TREND_MONTHS months
  const buckets = new Map<string, { total: number; count: number }>()
  const trendStart = new Date(now)
  trendStart.setMonth(trendStart.getMonth() - (TREND_MONTHS - 1))
  trendStart.setDate(1)
  trendStart.setHours(0, 0, 0, 0)

  // Per-animal first/last weighing for ADG
  const firstLast = new Map<string, { first: WeightRecord; last: WeightRecord }>()

  for (const record of records) {
    const date = record.recordDate
    if (date.getTime() >= trendStart.getTime()) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const bucket = buckets.get(monthKey)
      if (bucket) {
        bucket.total += record.weightKg
        bucket.count += 1
      } else {
        buckets.set(monthKey, { total: record.weightKg, count: 1 })
      }
    }

    const entry = firstLast.get(record.animalId)
    if (!entry) {
      firstLast.set(record.animalId, { first: record, last: record })
    } else {
      if (date.getTime() < entry.first.recordDate.getTime()) entry.first = record
      if (date.getTime() > entry.last.recordDate.getTime()) entry.last = record
    }
  }

  const trend: WeightTrendPoint[] = Array.from(buckets.entries())
    .map(([monthKey, bucket]) => {
      const monthIndex = Number(monthKey.slice(5)) - 1
      const label = new Date(Number(monthKey.slice(0, 4)), monthIndex, 1).toLocaleString(
        undefined,
        {
          month: "short",
        },
      )
      return {
        monthKey,
        label,
        avgKg: Math.round((bucket.total / bucket.count) * 10) / 10,
        count: bucket.count,
      }
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))

  let gainTotal = 0
  let gainCount = 0
  for (const { first, last } of firstLast.values()) {
    const days = (last.recordDate.getTime() - first.recordDate.getTime()) / MS_PER_DAY
    if (days >= 1) {
      gainTotal += (last.weightKg - first.weightKg) / days
      gainCount += 1
    }
  }

  return {
    trend,
    adgKgPerDay: gainCount > 0 ? Math.round((gainTotal / gainCount) * 100) / 100 : null,
    latestAvgKg: trend.length > 0 ? trend[trend.length - 1].avgKg : null,
    recordCount: records.length,
  }
}

/**
 * Live dashboard metrics for the Reports screen. Follows the
 * useDashboardStats pattern: observable queries combined with combineLatest,
 * with a short auditTime so bulk writes (sync) don't recompute per row.
 */
export function useReportAggregates() {
  const { currentOrg } = useDatabase()
  const [aggregates, setAggregates] = useState<ReportAggregates>(EMPTY_AGGREGATES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setAggregates(EMPTY_AGGREGATES)
      setIsLoading(false)
      return
    }

    const orgClause = Q.where("organization_id", currentOrg.id)
    const notDeleted = Q.where("is_deleted", false)
    const now = Date.now()

    const weightWindowStart = new Date(now)
    weightWindowStart.setMonth(weightWindowStart.getMonth() - WEIGHT_WINDOW_MONTHS)

    const animals$ = database.get<Animal>("animals").query(orgClause, notDeleted).observe()

    const weights$ = database
      .get<WeightRecord>("weight_records")
      .query(orgClause, notDeleted, Q.where("record_date", Q.gte(weightWindowStart.getTime())))
      .observe()

    const breedingBase = database.get("breeding_records")
    const liveCalves$ = breedingBase
      .query(orgClause, notDeleted, Q.where("outcome", "live_calf"))
      .observeCount()
    const pending$ = breedingBase
      .query(orgClause, notDeleted, Q.where("outcome", "pending"))
      .observeCount()
    const stillborn$ = breedingBase
      .query(orgClause, notDeleted, Q.where("outcome", "stillborn"))
      .observeCount()
    const aborted$ = breedingBase
      .query(orgClause, notDeleted, Q.where("outcome", "aborted"))
      .observeCount()
    const open$ = breedingBase
      .query(orgClause, notDeleted, Q.where("outcome", "open"))
      .observeCount()

    const vaccinationsBase = database.get("scheduled_vaccinations")
    const administered$ = vaccinationsBase
      .query(orgClause, notDeleted, Q.where("status", "administered"))
      .observeCount()
    const outstanding$ = vaccinationsBase
      .query(orgClause, notDeleted, Q.where("status", Q.oneOf(["pending", "overdue"])))
      .observeCount()
    const overdue$ = vaccinationsBase
      .query(
        orgClause,
        notDeleted,
        Q.or(
          Q.where("status", "overdue"),
          Q.and(Q.where("status", "pending"), Q.where("due_date", Q.lt(now))),
        ),
      )
      .observeCount()

    const pastures$ = database
      .get<Pasture>("pastures")
      .query(orgClause, notDeleted, Q.where("is_active", true))
      .observe()

    const sub = combineLatest([
      animals$,
      weights$,
      liveCalves$,
      pending$,
      stillborn$,
      aborted$,
      open$,
      administered$,
      outstanding$,
      overdue$,
      pastures$,
    ])
      .pipe(auditTime(150))
      .subscribe(
        ([
          animals,
          weights,
          liveCalves,
          pending,
          stillborn,
          aborted,
          open,
          administered,
          outstanding,
          overdue,
          pastures,
        ]) => {
          const resolvedCount = liveCalves + stillborn + aborted + open
          const vaccinationTotal = administered + outstanding

          setAggregates({
            composition: computeComposition(animals, now),
            growth: computeGrowth(weights, now),
            breeding: {
              liveCalves,
              resolvedCount,
              pendingCount: pending,
              calvingRatePct:
                resolvedCount > 0 ? Math.round((liveCalves / resolvedCount) * 100) : null,
              byOutcome: {
                live_calf: liveCalves,
                pending,
                stillborn,
                aborted,
                open,
              },
            },
            vaccinations: {
              administered,
              outstanding,
              overdue,
              coveragePct:
                vaccinationTotal > 0 ? Math.round((administered / vaccinationTotal) * 100) : null,
            },
            pastures: pastures.map((pasture) => ({
              id: pasture.id,
              name: pasture.name,
              currentCount: pasture.currentAnimalCount,
              maxCapacity: pasture.maxCapacity,
              occupancyPct: pasture.occupancyPercentage,
            })),
          })
          setIsLoading(false)
        },
      )

    return () => sub.unsubscribe()
  }, [currentOrg])

  return { aggregates, isLoading }
}
