import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { Animal, AnimalSex, AnimalStatus } from "@/db/models/Animal"
import { useDatabase } from "@/context/DatabaseContext"
import { calculateScheduledVaccinations } from "@/services/vaccinationScheduler"

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
  herdTag?: string
  notes?: string
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

  const createAnimal = async (data: AnimalFormData): Promise<Animal> => {
    if (!currentOrg) throw new Error("No organization selected")

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
        animal.herdTag = data.herdTag ?? null
        animal.notes = data.notes ?? null
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

    const shouldRecalculate = data.dateOfBirth !== undefined || data.sex !== undefined || data.status !== undefined

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
        if (data.herdTag !== undefined) a.herdTag = data.herdTag ?? null
        if (data.notes !== undefined) a.notes = data.notes ?? null
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
