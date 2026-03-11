import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { Animal, AnimalSex, AnimalStatus } from "@/db/models/Animal"
import { useDatabase } from "@/context/DatabaseContext"

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

    return database.write(async () => {
      return database.get<Animal>("animals").create((animal) => {
        animal.organizationId = currentOrg.id
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
        animal.notes = data.notes ?? null
        animal.isDeleted = false
      })
    })
  }

  const updateAnimal = async (animalId: string, data: Partial<AnimalFormData>): Promise<void> => {
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
        if (data.notes !== undefined) a.notes = data.notes ?? null
      })
    })
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
