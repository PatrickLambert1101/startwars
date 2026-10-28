import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { combineLatest } from "rxjs"

import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import {
  Animal,
  BreedingRecord,
  HealthRecord,
  Pasture,
  PastureActivity,
  PastureMovement,
} from "@/db/models"
import { buildDashboardActivity, type DashboardActivityItem } from "@/utils/dashboardActivity"

const SOURCE_LIMIT = 12
const MOVEMENT_SOURCE_LIMIT = 50

export function useDashboardActivity() {
  const { currentOrg } = useDatabase()
  const [activities, setActivities] = useState<DashboardActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setActivities([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setActivities([])
    let cancelled = false
    let generation = 0
    const orgClause = Q.where("organization_id", currentOrg.id)
    const notDeleted = Q.where("is_deleted", false)

    const health$ = database
      .get<HealthRecord>("health_records")
      .query(orgClause, notDeleted, Q.sortBy("record_date", Q.desc), Q.take(SOURCE_LIMIT))
      .observe()
    const breeding$ = database
      .get<BreedingRecord>("breeding_records")
      .query(orgClause, notDeleted, Q.sortBy("breeding_date", Q.desc), Q.take(SOURCE_LIMIT))
      .observe()
    const movements$ = database
      .get<PastureMovement>("pasture_movements")
      .query(
        orgClause,
        notDeleted,
        Q.sortBy("movement_date", Q.desc),
        Q.take(MOVEMENT_SOURCE_LIMIT),
      )
      .observe()
    const pastureActivities$ = database
      .get<PastureActivity>("pasture_activities")
      .query(orgClause, notDeleted, Q.sortBy("activity_date", Q.desc), Q.take(SOURCE_LIMIT))
      .observe()

    const subscription = combineLatest([
      health$,
      breeding$,
      movements$,
      pastureActivities$,
    ]).subscribe(async ([healthRecords, breedingRecords, pastureMovements, pastureActivities]) => {
      const currentGeneration = ++generation
      try {
        const animalIds = Array.from(
          new Set([
            ...healthRecords.map((record) => record.animalId),
            ...breedingRecords.map((record) => record.animalId),
            ...pastureMovements.map((movement) => movement.animalId),
          ]),
        )
        const pastureIds = Array.from(
          new Set([
            ...pastureMovements.map((movement) => movement.pastureId),
            ...pastureActivities.map((activity) => activity.pastureId),
          ]),
        )

        const [animals, pastures] = await Promise.all([
          animalIds.length
            ? database
                .get<Animal>("animals")
                .query(Q.where("id", Q.oneOf(animalIds)))
                .fetch()
            : Promise.resolve([]),
          pastureIds.length
            ? database
                .get<Pasture>("pastures")
                .query(Q.where("id", Q.oneOf(pastureIds)))
                .fetch()
            : Promise.resolve([]),
        ])

        if (cancelled || currentGeneration !== generation) return

        setActivities(
          buildDashboardActivity({
            healthRecords,
            breedingRecords,
            pastureMovements,
            pastureActivities,
            animalNames: new Map(animals.map((animal) => [animal.id, animal.displayName])),
            pastureNames: new Map(pastures.map((pasture) => [pasture.id, pasture.name])),
          }),
        )
      } catch (error) {
        console.error("[Dashboard] Failed to build recent activity:", error)
        if (!cancelled && currentGeneration === generation) setActivities([])
      } finally {
        if (!cancelled && currentGeneration === generation) setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [currentOrg])

  return { activities, isLoading }
}
