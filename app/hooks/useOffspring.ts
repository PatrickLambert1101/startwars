import { useState, useEffect, useMemo } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { logDatabaseOperation, measureDatabaseQuery } from "@/services/sentry"

export interface OffspringStats {
  total: number
  alive: number
  sold: number
  deceased: number
  transferred: number
  male: number
  female: number
  castrated: number
}

export function useOffspring(animalId: string | null) {
  const [offspring, setOffspring] = useState<Animal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!animalId) {
      setOffspring([])
      setIsLoading(false)
      return
    }

    const loadOffspring = async () => {
      setIsLoading(true)
      try {
        // Find where this animal is the sire
        const asSire = await measureDatabaseQuery(
          "findOffspringAsSire",
          "animals",
          () => database.get<Animal>("animals")
            .query(
              Q.where("sire_id", animalId),
              Q.where("is_deleted", false)
            )
            .fetch()
        )

        // Find where this animal is the dam
        const asDam = await measureDatabaseQuery(
          "findOffspringAsDam",
          "animals",
          () => database.get<Animal>("animals")
            .query(
              Q.where("dam_id", animalId),
              Q.where("is_deleted", false)
            )
            .fetch()
        )

        // Combine and deduplicate (in case animal is both sire and dam, which shouldn't happen but let's be safe)
        const allOffspring = [...asSire, ...asDam]
        const uniqueIds = new Set<string>()
        const unique = allOffspring.filter(animal => {
          if (uniqueIds.has(animal.id)) {
            return false
          }
          uniqueIds.add(animal.id)
          return true
        })

        setOffspring(unique)

        logDatabaseOperation("query", {
          table: "animals",
          recordCount: unique.length,
          query: `offspring for ${animalId}`,
        })
      } catch (error) {
        console.error("[useOffspring] Failed to load offspring:", error)
        logDatabaseOperation("query", {
          table: "animals",
          error: error as Error,
          query: `offspring for ${animalId}`,
        })
        setOffspring([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOffspring()
  }, [animalId])

  const stats: OffspringStats = useMemo(() => {
    const total = offspring.length
    const alive = offspring.filter(a => a.status === "active").length
    const sold = offspring.filter(a => a.status === "sold").length
    const deceased = offspring.filter(a => a.status === "deceased").length
    const transferred = offspring.filter(a => a.status === "transferred").length
    const male = offspring.filter(a => a.sex === "male").length
    const female = offspring.filter(a => a.sex === "female").length
    const castrated = offspring.filter(a => a.sex === "castrated").length

    return {
      total,
      alive,
      sold,
      deceased,
      transferred,
      male,
      female,
      castrated,
    }
  }, [offspring])

  return {
    offspring,
    stats,
    isLoading,
  }
}
