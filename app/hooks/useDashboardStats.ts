import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { combineLatest } from "rxjs"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { BreedingRecord } from "@/db/models/BreedingRecord"
import { useDatabase } from "@/context/DatabaseContext"

const RECENT_ANIMALS_LIMIT = 5

export type DashboardStats = {
  totalHead: number
  activeCount: number
  dueToCalve: number
  recentAnimals: Animal[]
}

/**
 * Dashboard stats via independent count queries instead of pulling the
 * whole herd into memory. Scales O(1) in the stat counts (indexed columns)
 * and O(RECENT_ANIMALS_LIMIT) for the recent list, regardless of herd size.
 */
export function useDashboardStats() {
  const { currentOrg } = useDatabase()
  const [stats, setStats] = useState<DashboardStats>({
    totalHead: 0,
    activeCount: 0,
    dueToCalve: 0,
    recentAnimals: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setStats({ totalHead: 0, activeCount: 0, dueToCalve: 0, recentAnimals: [] })
      setIsLoading(false)
      return
    }

    const animals = database.get<Animal>("animals")
    const breeding = database.get<BreedingRecord>("breeding_records")

    const orgClause = Q.where("organization_id", currentOrg.id)
    const notDeleted = Q.where("is_deleted", false)

    const totalHead$ = animals.query(orgClause, notDeleted).observeCount()
    const activeCount$ = animals
      .query(orgClause, notDeleted, Q.where("status", "active"))
      .observeCount()
    const dueToCalve$ = breeding
      .query(orgClause, notDeleted, Q.where("outcome", "pending"))
      .observeCount()
    const recent$ = animals
      .query(orgClause, notDeleted, Q.sortBy("updated_at", Q.desc), Q.take(RECENT_ANIMALS_LIMIT))
      .observe()

    const sub = combineLatest([totalHead$, activeCount$, dueToCalve$, recent$]).subscribe(
      ([totalHead, activeCount, dueToCalve, recentAnimals]) => {
        setStats({ totalHead, activeCount, dueToCalve, recentAnimals })
        setIsLoading(false)
      },
    )

    return () => sub.unsubscribe()
  }, [currentOrg])

  return { stats, isLoading }
}
