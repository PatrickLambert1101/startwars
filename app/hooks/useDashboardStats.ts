import { getVaccinationHistory } from "@/utils/vaccinationHistory"
import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { addDays, startOfDay } from "date-fns"
import { combineLatest } from "rxjs"

import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { BreedingRecord } from "@/db/models/BreedingRecord"

export type DashboardStats = {
  historiesToReview: number
  activeSchedules: number
  activeCount: number
  assignedToPastureCount: number
  dueToCalve: number
  overdueCalvings: number
}

/**
 * Dashboard stats via independent count queries instead of pulling the
 * whole herd into memory. Scales O(1) in the stat counts (indexed columns)
 * and O(RECENT_ANIMALS_LIMIT) for the recent list, regardless of herd size.
 */
export function useDashboardStats() {
  const { currentOrg } = useDatabase()
  const [stats, setStats] = useState<DashboardStats>({
    historiesToReview: 0,
    activeSchedules: 0,
    activeCount: 0,
    assignedToPastureCount: 0,
    dueToCalve: 0,
    overdueCalvings: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setStats({
        historiesToReview: 0,
        activeSchedules: 0,
        activeCount: 0,
        assignedToPastureCount: 0,
        dueToCalve: 0,
        overdueCalvings: 0,
      })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setStats({
      historiesToReview: 0,
      activeSchedules: 0,
      activeCount: 0,
      assignedToPastureCount: 0,
      dueToCalve: 0,
      overdueCalvings: 0,
    })

    const animals = database.get<Animal>("animals")
    const breeding = database.get<BreedingRecord>("breeding_records")

    const orgClause = Q.where("organization_id", currentOrg.id)
    const notDeleted = Q.where("is_deleted", false)
    const today = startOfDay(new Date())
    const attentionWindowEnd = addDays(today, 60)

    // Keep the active animal rows, rather than only their count, so breeding
    // alerts cannot include animals that have since been sold or deceased.
    const activeAnimals$ = animals
      .query(orgClause, notDeleted, Q.where("status", "active"))
      .observeWithColumns(["current_pasture_id", "vaccination_history", "vaccinations_up_to_date"])
    const dueToCalve$ = breeding
      .query(
        orgClause,
        notDeleted,
        Q.where("outcome", "pending"),
        Q.where("expected_calving_date", Q.lte(attentionWindowEnd.getTime())),
      )
      .observe()

    const activeSchedules$ = database
      .get("vaccination_schedules")
      .query(orgClause, notDeleted, Q.where("is_active", true))
      .observeCount()
    const sub = combineLatest([activeAnimals$, dueToCalve$, activeSchedules$]).subscribe(
      ([activeAnimals, dueRecords, activeSchedules]) => {
        const activeAnimalIds = new Set(activeAnimals.map((animal) => animal.id))
        const actionableCalvings = dueRecords.filter(
          (record) => record.expectedCalvingDate !== null && activeAnimalIds.has(record.animalId),
        )
        setStats({
          historiesToReview: activeAnimals.filter(
            (animal) => !animal.vaccinationHistory || getVaccinationHistory(animal) !== "current",
          ).length,
          activeSchedules,
          activeCount: activeAnimals.length,
          assignedToPastureCount: activeAnimals.filter((animal) => Boolean(animal.currentPastureId))
            .length,
          dueToCalve: actionableCalvings.length,
          overdueCalvings: actionableCalvings.filter(
            (record) => record.expectedCalvingDate!.getTime() < today.getTime(),
          ).length,
        })
        setIsLoading(false)
      },
    )

    return () => sub.unsubscribe()
  }, [currentOrg])

  return { stats, isLoading }
}
