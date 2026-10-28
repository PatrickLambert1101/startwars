import { addDays, differenceInCalendarDays, startOfDay } from "date-fns"

import type { AnimalSpecies } from "@/db/models/Animal"
import type { BreedingOutcome } from "@/db/models/BreedingRecord"

export type BreedingDashboardFilter = "all" | "attention" | "pending" | "history"
export type CalvingTimingStatus =
  | "overdue"
  | "today"
  | "soon"
  | "later"
  | "unscheduled"
  | "complete"

export interface BreedingDashboardItem {
  id: string
  animalName: string
  breedingDate: Date
  expectedCalvingDate: Date | null
  outcome: BreedingOutcome
}

export interface CalvingTiming {
  status: CalvingTimingStatus
  days: number | null
  label: string
}

const ATTENTION_WINDOW_DAYS = 60

const GESTATION_DAYS: Record<AnimalSpecies, number> = {
  cattle: 283,
  buffalo: 340,
  horses: 340,
  sheep: 147,
  goats: 150,
  game: 240,
  pigs: 114,
  poultry: 21,
}

export function expectedCalvingFromBreedingDate(
  breedingDate: Date,
  species: AnimalSpecies = "cattle",
): Date {
  return addDays(breedingDate, GESTATION_DAYS[species] ?? GESTATION_DAYS.cattle)
}

export function getCalvingTiming(
  record: Pick<BreedingDashboardItem, "outcome" | "expectedCalvingDate">,
  today = new Date(),
): CalvingTiming {
  if (record.outcome !== "pending") {
    return { status: "complete", days: null, label: "Completed" }
  }
  if (!record.expectedCalvingDate) {
    return { status: "unscheduled", days: null, label: "Expected date not set" }
  }

  const days = differenceInCalendarDays(
    startOfDay(record.expectedCalvingDate),
    startOfDay(today),
  )
  if (days < 0) {
    return {
      status: "overdue",
      days,
      label: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`,
    }
  }
  if (days === 0) return { status: "today", days, label: "Due today" }
  if (days <= ATTENTION_WINDOW_DAYS) {
    return { status: "soon", days, label: `Due in ${days} day${days === 1 ? "" : "s"}` }
  }
  return { status: "later", days, label: `Due in ${days} days` }
}

export function summarizeBreedingRecords(
  records: BreedingDashboardItem[],
  today = new Date(),
) {
  let pending = 0
  let attention = 0
  let overdue = 0
  let history = 0

  for (const record of records) {
    if (record.outcome !== "pending") {
      history += 1
      continue
    }

    pending += 1
    const timing = getCalvingTiming(record, today)
    if (timing.status === "overdue") {
      overdue += 1
      attention += 1
    } else if (timing.status === "today" || timing.status === "soon") {
      attention += 1
    }
  }

  return { total: records.length, pending, attention, overdue, history }
}

export function filterAndSortBreedingRecords<T extends BreedingDashboardItem>(
  records: T[],
  filter: BreedingDashboardFilter,
  search: string,
  today = new Date(),
): T[] {
  const query = search.trim().toLocaleLowerCase()
  const filtered = records.filter((record) => {
    if (query && !record.animalName.toLocaleLowerCase().includes(query)) return false
    if (filter === "pending" && record.outcome !== "pending") return false
    if (filter === "history" && record.outcome === "pending") return false
    if (filter === "attention") {
      const timing = getCalvingTiming(record, today)
      return ["overdue", "today", "soon"].includes(timing.status)
    }
    return true
  })

  return filtered.sort((left, right) => {
    const leftTiming = getCalvingTiming(left, today)
    const rightTiming = getCalvingTiming(right, today)
    const urgencyRank: Record<CalvingTimingStatus, number> = {
      overdue: 0,
      today: 1,
      soon: 2,
      unscheduled: 3,
      later: 4,
      complete: 5,
    }
    const rankDifference = urgencyRank[leftTiming.status] - urgencyRank[rightTiming.status]
    if (rankDifference !== 0) return rankDifference

    if (left.expectedCalvingDate && right.expectedCalvingDate) {
      const dueDifference =
        left.expectedCalvingDate.getTime() - right.expectedCalvingDate.getTime()
      if (dueDifference !== 0) return dueDifference
    }
    return right.breedingDate.getTime() - left.breedingDate.getTime()
  })
}
