import { useEffect, useState, useMemo } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { Animal, AnimalSex, AnimalStatus } from "@/db/models/Animal"
import { useDatabase } from "@/context/DatabaseContext"
import { useSubscription } from "@/context/SubscriptionContext"
import { calculateScheduledVaccinations } from "@/services/vaccinationScheduler"
import type { FilterState } from "@/components/FilterModal"

/**
 * Thrown by createAnimal when a free-plan org tries to add an animal beyond the
 * free limit. Enforced at the data layer so both the single and bulk add flows
 * are covered and a rapid bulk loop can't slip past a stale count.
 */
export class AnimalLimitError extends Error {
  constructor(public readonly limit: number) {
    super(`Free plan is limited to ${limit} animals`)
    this.name = "AnimalLimitError"
  }
}

/**
 * Thrown when a create/update would give two animals the same visual or RFID
 * tag within an org. Carries enough detail for the UI to name the conflict.
 * Checked at the data layer (not per-screen) so both the single and bulk add
 * flows are covered, and so rapid bulk inserts can't race a stale local list.
 */
export class DuplicateTagError extends Error {
  constructor(
    public readonly tagKind: "visual" | "rfid",
    public readonly tagValue: string,
    public readonly existingName: string,
  ) {
    super(`Duplicate ${tagKind} tag: ${tagValue}`)
    this.name = "DuplicateTagError"
  }
}

/**
 * Look for an existing (non-deleted) animal in the org that already uses the
 * given visual or RFID tag. Comparison is trimmed + case-insensitive to match
 * how a farmer thinks of a tag ("A12" == "a12"). Empty tags never collide.
 */
async function findTagConflict(
  organizationId: string,
  visualTag: string,
  rfidTag: string,
  excludeAnimalId?: string,
): Promise<DuplicateTagError | null> {
  const v = visualTag.trim().toLowerCase()
  const r = rfidTag.trim().toLowerCase()
  if (!v && !r) return null

  const existing = await database
    .get<Animal>("animals")
    .query(Q.where("organization_id", organizationId), Q.where("is_deleted", false))
    .fetch()

  for (const a of existing) {
    if (excludeAnimalId && a.id === excludeAnimalId) continue
    if (v && a.visualTag?.trim().toLowerCase() === v) {
      return new DuplicateTagError("visual", visualTag.trim(), a.displayName)
    }
    if (r && a.rfidTag?.trim().toLowerCase() === r) {
      return new DuplicateTagError("rfid", rfidTag.trim(), a.displayName)
    }
  }
  return null
}

// Columns we can sort on at the DB level. Anything else falls back to visual_tag.
const DB_SORT_COLUMNS: Record<string, string> = {
  visualTag: "visual_tag",
  breed: "breed",
  sex: "sex",
  status: "status",
  dateOfBirth: "date_of_birth",
}

export type AnimalFormData = {
  rfidTag: string
  visualTag: string
  name?: string
  breed: string
  sex: AnimalSex
  dateOfBirth?: Date
  sireId?: string
  damId?: string
  registrationNumber?: string
  status: AnimalStatus
  /**
   * True = already current on its shots, so the scheduler skips anything that
   * fell due before now. Defaults to true — most animals being added to an
   * established herd are already vaccinated.
   */
  vaccinationsUpToDate?: boolean
  herdTag?: string
  notes?: string
  /** JSON-encoded array of tag strings (e.g. ["Breeding Stock"]), or null. */
  tags?: string | null
}

export function useAnimals() {
  const { currentOrg } = useDatabase()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setAnimals([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<Animal>("animals")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.sortBy("updated_at", Q.desc),
      )
      .observe()
      .subscribe((result) => {
        setAnimals(result)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { animals, isLoading }
}

/**
 * DB-level filtered/paginated animals query.
 *
 * Pushes cheap filters (search, breed, sex, status, sort) into WatermelonDB so we
 * don't pull the entire herd into JS memory. Expensive/computed filters
 * (age, tag search, parent) run in-memory via useComputedAnimalFilters.
 *
 * If `pageSize` is provided, only that many rows are loaded (plus 1 extra to
 * detect `hasMore`). Call `loadMore()` to grow the window.
 */
export function useAnimalsQuery(
  filters: FilterState,
  searchQuery: string,
  pageSize?: number,
) {
  const { currentOrg } = useDatabase()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [limit, setLimit] = useState(pageSize ?? 0)
  const [hasMore, setHasMore] = useState(false)

  // Reset the window whenever filters/search/org change
  useEffect(() => {
    setLimit(pageSize ?? 0)
  }, [pageSize, searchQuery, filters.breeds, filters.sexes, filters.statuses, filters.sortBy, filters.sortDirection, currentOrg?.id])

  useEffect(() => {
    if (!currentOrg) {
      setAnimals([])
      setIsLoading(false)
      return
    }

    const clauses: Q.Clause[] = [
      Q.where("organization_id", currentOrg.id),
      Q.where("is_deleted", false),
    ]

    // Text search across visual_tag / rfid_tag / name / breed
    const trimmed = searchQuery.trim()
    if (trimmed) {
      const like = Q.like(`%${Q.sanitizeLikeString(trimmed)}%`)
      clauses.push(
        Q.or(
          Q.where("visual_tag", like),
          Q.where("rfid_tag", like),
          Q.where("name", like),
          Q.where("breed", like),
        ),
      )
    }

    if (filters.breeds.length > 0) {
      clauses.push(Q.where("breed", Q.oneOf(filters.breeds)))
    }
    if (filters.sexes.length > 0) {
      clauses.push(Q.where("sex", Q.oneOf(filters.sexes)))
    }
    if (filters.statuses.length > 0) {
      clauses.push(Q.where("status", Q.oneOf(filters.statuses)))
    }

    // Sort: push to DB when possible, otherwise default to updated_at desc
    const sortColumn = DB_SORT_COLUMNS[filters.sortBy as string]
    if (sortColumn) {
      const direction = filters.sortDirection === "asc" ? Q.asc : Q.desc
      clauses.push(Q.sortBy(sortColumn, direction))
    } else {
      clauses.push(Q.sortBy("updated_at", Q.desc))
    }

    // Fetch one extra row so we can tell if there are more pages
    if (limit > 0) {
      clauses.push(Q.take(limit + 1))
    }

    setIsLoading(true)
    const subscription = database
      .get<Animal>("animals")
      .query(...clauses)
      .observe()
      .subscribe((result) => {
        if (limit > 0 && result.length > limit) {
          setAnimals(result.slice(0, limit))
          setHasMore(true)
        } else {
          setAnimals(result)
          setHasMore(false)
        }
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [
    currentOrg,
    searchQuery,
    filters.breeds,
    filters.sexes,
    filters.statuses,
    filters.sortBy,
    filters.sortDirection,
    limit,
  ])

  const loadMore = () => {
    if (!hasMore || !pageSize) return
    setLimit((prev) => prev + pageSize)
  }

  return { animals, isLoading, hasMore, loadMore }
}

export function useAnimal(animalId: string) {
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!animalId) {
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<Animal>("animals")
      .findAndObserve(animalId)
      .subscribe({
        next: (result) => {
          setAnimal(result)
          setIsLoading(false)
        },
        error: () => {
          setAnimal(null)
          setIsLoading(false)
        },
      })

    return () => subscription.unsubscribe()
  }, [animalId])

  return { animal, isLoading }
}

export function useAnimalActions() {
  const { currentOrg } = useDatabase()
  const { animalLimit } = useSubscription()

  const createAnimal = async (data: AnimalFormData): Promise<Animal> => {
    if (!currentOrg) throw new Error("No organization selected")

    // Enforce the plan's animal cap. Counted live at write time so a bulk loop
    // can't race past it. Unlimited plans (Infinity) skip the query entirely.
    if (animalLimit !== Infinity) {
      const count = await database
        .get<Animal>("animals")
        .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
        .fetchCount()
      if (count >= animalLimit) throw new AnimalLimitError(animalLimit)
    }

    const conflict = await findTagConflict(currentOrg.id, data.visualTag, data.rfidTag)
    if (conflict) throw conflict

    const animal = await database.write(async () => {
      return database.get<Animal>("animals").create((animal) => {
        animal.organizationId = currentOrg.id
        // Default to first livestock type (usually cattle for most farms)
        animal.species = currentOrg.livestockTypes?.[0] ?? "cattle"
        animal.rfidTag = data.rfidTag
        animal.visualTag = data.visualTag
        animal.name = data.name ?? null
        animal.breed = data.breed
        animal.sex = data.sex
        animal.dateOfBirth = data.dateOfBirth ?? null
        animal.sireId = data.sireId ?? null
        animal.damId = data.damId ?? null
        animal.registrationNumber = data.registrationNumber ?? null
        animal.status = data.status
        animal.vaccinationsUpToDate = data.vaccinationsUpToDate ?? true
        animal.herdTag = data.herdTag ?? null
        animal.notes = data.notes ?? null
        animal.tags = data.tags ?? null
        animal.isDeleted = false
      })
    })

    // Auto-calculate vaccinations for the new animal
    if (__DEV__) {
      console.log("[useAnimals] Auto-calculating vaccinations for new animal:", animal.displayName, {
        species: animal.species,
        dateOfBirth: animal.dateOfBirth?.toISOString(),
        sex: animal.sex,
        status: animal.status
      })
    }
    calculateScheduledVaccinations(currentOrg.id).catch((error) => {
      console.error("[useAnimals] Failed to auto-calculate vaccinations:", error)
    })

    return animal
  }

  const updateAnimal = async (animalId: string, data: Partial<AnimalFormData>): Promise<void> => {
    if (!currentOrg) throw new Error("No organization selected")

    // Only guard tags that are actually changing; pass "" for the untouched one
    // so it never collides. Exclude this animal so it doesn't match itself.
    if (data.visualTag !== undefined || data.rfidTag !== undefined) {
      const conflict = await findTagConflict(
        currentOrg.id,
        data.visualTag ?? "",
        data.rfidTag ?? "",
        animalId,
      )
      if (conflict) throw conflict
    }

    const shouldRecalculate =
      data.dateOfBirth !== undefined ||
      data.sex !== undefined ||
      data.status !== undefined ||
      data.vaccinationsUpToDate !== undefined

    await database.write(async () => {
      const animal = await database.get<Animal>("animals").find(animalId)
      await animal.update((a) => {
        if (data.rfidTag !== undefined) a.rfidTag = data.rfidTag
        if (data.visualTag !== undefined) a.visualTag = data.visualTag
        if (data.name !== undefined) a.name = data.name ?? null
        if (data.breed !== undefined) a.breed = data.breed
        if (data.sex !== undefined) a.sex = data.sex
        if (data.dateOfBirth !== undefined) a.dateOfBirth = data.dateOfBirth ?? null
        if (data.sireId !== undefined) a.sireId = data.sireId ?? null
        if (data.damId !== undefined) a.damId = data.damId ?? null
        if (data.registrationNumber !== undefined) a.registrationNumber = data.registrationNumber ?? null
        if (data.status !== undefined) a.status = data.status
        if (data.vaccinationsUpToDate !== undefined) a.vaccinationsUpToDate = data.vaccinationsUpToDate
        if (data.herdTag !== undefined) a.herdTag = data.herdTag ?? null
        if (data.notes !== undefined) a.notes = data.notes ?? null
        if (data.tags !== undefined) a.tags = data.tags ?? null
      })
    })

    // Auto-recalculate vaccinations if age, sex, or status changed (affects eligibility)
    if (shouldRecalculate) {
      if (__DEV__) {
        console.log("[useAnimals] Auto-recalculating vaccinations after animal update")
      }
      calculateScheduledVaccinations(currentOrg.id).catch((error) => {
        console.error("[useAnimals] Failed to auto-calculate vaccinations:", error)
      })
    }
  }

  const deleteAnimal = async (animalId: string): Promise<void> => {
    await database.write(async () => {
      const animal = await database.get<Animal>("animals").find(animalId)
      await animal.update((a) => {
        a.isDeleted = true
      })
    })
  }

  return { createAnimal, updateAnimal, deleteAnimal }
}

/**
 * Apply the subset of filters that require in-memory/computed access:
 * age range (needs dateOfBirth math), tag search (JSON field), parent filter.
 *
 * Use this alongside `useAnimalsQuery`, which already handles
 * search/breed/sex/status/sort at the DB level.
 */
export function useComputedAnimalFilters(animals: Animal[], filters: FilterState) {
  return useMemo(() => {
    let filtered = animals

    // Age range (in months) - requires dateOfBirth math
    if (filters.ageFrom !== null || filters.ageTo !== null) {
      filtered = filtered.filter((a) => {
        if (!a.dateOfBirth) return false
        const ageInMonths = Math.floor(
          (Date.now() - a.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
        )
        if (filters.ageFrom !== null && ageInMonths < filters.ageFrom) return false
        if (filters.ageTo !== null && ageInMonths > filters.ageTo) return false
        return true
      })
    }

    // Tag search - tags are stored as JSON, can't query directly
    if (filters.tagSearch.trim()) {
      const tagQuery = filters.tagSearch.toLowerCase()
      filtered = filtered.filter((a) =>
        a.tagsList.some((tag) => tag.toLowerCase().includes(tagQuery)),
      )
    }

    // Parent filter (matches either sire or dam)
    if (filters.parentAnimalId) {
      filtered = filtered.filter(
        (a) => a.sireId === filters.parentAnimalId || a.damId === filters.parentAnimalId,
      )
    }

    return filtered
  }, [animals, filters.ageFrom, filters.ageTo, filters.tagSearch, filters.parentAnimalId])
}

