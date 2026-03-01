import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { BreedingRecord } from "@/db/models/BreedingRecord"
import { useDatabase } from "@/context/DatabaseContext"

export type DashboardStats = {
  totalHead: number
  activeCount: number
  dueToCalve: number
  recentAnimals: Animal[]
}

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
      setIsLoading(false)
      return
    }

    const animalsQuery = database.get<Animal>("animals").query(
      Q.where("organization_id", currentOrg.id),
      Q.where("is_deleted", false),
    )

    const sub = animalsQuery.observe().subscribe(async (allAnimals) => {
      const activeCount = allAnimals.filter((a) => a.status === "active").length

      // Count pending breeding records (due to calve)
      let dueToCalve = 0
      try {
        const pendingBreedings = await database.get<BreedingRecord>("breeding_records")
          .query(
            Q.where("organization_id", currentOrg.id),
            Q.where("is_deleted", false),
            Q.where("outcome", "pending"),
          )
          .fetchCount()
        dueToCalve = pendingBreedings
      } catch {
        // ignore
      }

      // Most recently updated animals
      const recent = [...allAnimals]
        .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
        .slice(0, 5)

      setStats({
        totalHead: allAnimals.length,
        activeCount,
        dueToCalve,
        recentAnimals: recent,
      })
      setIsLoading(false)
    })

    return () => sub.unsubscribe()
  }, [currentOrg])

  return { stats, isLoading }
}
