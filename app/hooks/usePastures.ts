import { useEffect, useState } from "react"
import { database } from "@/db"
import { Pasture, PastureMovement, Animal } from "@/db/models"
import { Q } from "@nozbe/watermelondb"
import { useDatabase } from "@/context/DatabaseContext"

export interface PastureFormData {
  name: string
  code: string
  sizeHectares?: number
  locationNotes?: string
  forageType?: string
  waterSource?: string
  fenceType?: string
  hasSaltBlocks?: boolean
  hasMineralFeeders?: boolean
  maxCapacity?: number
  targetGrazingDays?: number
  targetRestDays?: number
  notes?: string
}

export function usePastures() {
  const [pastures, setPastures] = useState<Pasture[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentOrg } = useDatabase()

  useEffect(() => {
    if (!currentOrg) {
      setPastures([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<Pasture>("pastures")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.sortBy("name", Q.asc),
      )
      .observe()
      .subscribe((data) => {
        setPastures(data)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { pastures, isLoading }
}

export function usePasture(pastureId: string) {
  const [pasture, setPasture] = useState<Pasture | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!pastureId) {
      setPasture(null)
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<Pasture>("pastures")
      .findAndObserve(pastureId)
      .subscribe((data) => {
        setPasture(data)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [pastureId])

  return { pasture, isLoading }
}

export function usePastureMovements(pastureId: string) {
  const [movements, setMovements] = useState<PastureMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!pastureId) {
      setMovements([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<PastureMovement>("pasture_movements")
      .query(
        Q.where("pasture_id", pastureId),
        Q.where("is_deleted", false),
        Q.sortBy("movement_date", Q.desc),
      )
      .observe()
      .subscribe((data) => {
        setMovements(data)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [pastureId])

  return { movements, isLoading }
}

export function usePastureStats(pastureId: string) {
  const { movements } = usePastureMovements(pastureId)

  const stats = {
    totalMovementsIn: movements.filter((m) => m.movementType === "move_in").length,
    totalMovementsOut: movements.filter((m) => m.movementType === "move_out").length,
    lastMovementDate: movements.length > 0 ? movements[0].movementDate : null,
    averageGrazingDays: 0, // TODO: Calculate based on movement history
  }

  return stats
}

export function usePastureAnimals(pastureId: string) {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!pastureId) {
      setAnimals([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<Animal>("animals")
      .query(
        Q.where("current_pasture_id", pastureId),
        Q.where("is_deleted", false),
        Q.sortBy("visual_tag", Q.asc),
      )
      .observe()
      .subscribe((data) => {
        setAnimals(data)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [pastureId])

  return { animals, isLoading }
}

export function usePastureActions() {
  const { currentOrg } = useDatabase()

  const createPasture = async (data: PastureFormData) => {
    if (!currentOrg) throw new Error("No organization selected")

    return await database.write(async () => {
      return await database.get<Pasture>("pastures").create((pasture) => {
        pasture.organizationId = currentOrg.id
        pasture.name = data.name
        pasture.code = data.code
        pasture.sizeHectares = data.sizeHectares || null
        pasture.locationNotes = data.locationNotes || null
        pasture.forageType = data.forageType || null
        pasture.waterSource = data.waterSource || null
        pasture.fenceType = data.fenceType || null
        pasture.hasSaltBlocks = data.hasSaltBlocks || null
        pasture.hasMineralFeeders = data.hasMineralFeeders || null
        pasture.maxCapacity = data.maxCapacity || null
        pasture.targetGrazingDays = data.targetGrazingDays || null
        pasture.targetRestDays = data.targetRestDays || null
        pasture.notes = data.notes || null
        pasture.currentAnimalCount = 0
        pasture.isActive = true
        pasture.isDeleted = false
      })
    })
  }

  const updatePasture = async (pastureId: string, data: PastureFormData) => {
    await database.write(async () => {
      const pasture = await database.get<Pasture>("pastures").find(pastureId)
      await pasture.update((p) => {
        p.name = data.name
        p.code = data.code
        p.sizeHectares = data.sizeHectares || null
        p.locationNotes = data.locationNotes || null
        p.forageType = data.forageType || null
        p.waterSource = data.waterSource || null
        p.fenceType = data.fenceType || null
        p.hasSaltBlocks = data.hasSaltBlocks || null
        p.hasMineralFeeders = data.hasMineralFeeders || null
        p.maxCapacity = data.maxCapacity || null
        p.targetGrazingDays = data.targetGrazingDays || null
        p.targetRestDays = data.targetRestDays || null
        p.notes = data.notes || null
      })
    })
  }

  const deletePasture = async (pastureId: string) => {
    await database.write(async () => {
      const pasture = await database.get<Pasture>("pastures").find(pastureId)
      await pasture.update((p) => {
        p.isDeleted = true
      })
    })
  }

  const togglePastureActive = async (pastureId: string) => {
    await database.write(async () => {
      const pasture = await database.get<Pasture>("pastures").find(pastureId)
      await pasture.update((p) => {
        p.isActive = !p.isActive
      })
    })
  }

  const moveAnimalsIn = async (pastureId: string, animalIds: string[], notes?: string) => {
    if (!currentOrg) throw new Error("No organization selected")

    await database.write(async () => {
      const pasture = await database.get<Pasture>("pastures").find(pastureId)
      const now = new Date()

      // Create movement records for each animal
      for (const animalId of animalIds) {
        // Remove from current pasture if in one
        const animal = await database.get<Animal>("animals").find(animalId)
        if (animal.currentPastureId) {
          const oldPasture = await database.get<Pasture>("pastures").find(animal.currentPastureId)
          await oldPasture.update((p) => {
            p.currentAnimalCount = Math.max(0, p.currentAnimalCount - 1)
          })
        }

        // Create move-in record
        await database.get<PastureMovement>("pasture_movements").create((movement) => {
          movement.organizationId = currentOrg.id
          movement.pastureId = pastureId
          movement.animalId = animalId
          movement.movementDate = now
          movement.movementType = "move_in"
          movement.notes = notes || null
          movement.isDeleted = false
        })

        // Update animal's current pasture
        await animal.update((a) => {
          a.currentPastureId = pastureId
        })
      }

      // Update pasture stats
      await pasture.update((p) => {
        p.currentAnimalCount += animalIds.length
        if (p.currentAnimalCount > 0) {
          p.lastGrazedDate = now
        }
      })
    })
  }

  const moveAnimalsOut = async (pastureId: string, animalIds: string[], notes?: string) => {
    if (!currentOrg) throw new Error("No organization selected")

    await database.write(async () => {
      const pasture = await database.get<Pasture>("pastures").find(pastureId)
      const now = new Date()

      // Create movement records for each animal
      for (const animalId of animalIds) {
        // Create move-out record
        await database.get<PastureMovement>("pasture_movements").create((movement) => {
          movement.organizationId = currentOrg.id
          movement.pastureId = pastureId
          movement.animalId = animalId
          movement.movementDate = now
          movement.movementType = "move_out"
          movement.notes = notes || null
          movement.isDeleted = false
        })

        // Clear animal's current pasture
        const animal = await database.get<Animal>("animals").find(animalId)
        await animal.update((a) => {
          a.currentPastureId = null
        })
      }

      // Update pasture stats
      await pasture.update((p) => {
        p.currentAnimalCount = Math.max(0, p.currentAnimalCount - animalIds.length)
        // If empty, calculate next available date
        if (p.currentAnimalCount === 0 && p.targetRestDays) {
          const availableDate = new Date(now)
          availableDate.setDate(availableDate.getDate() + p.targetRestDays)
          p.availableFromDate = availableDate
        }
      })
    })
  }

  const moveAllAnimalsOut = async (pastureId: string, notes?: string) => {
    const animals = await database
      .get<Animal>("animals")
      .query(Q.where("current_pasture_id", pastureId), Q.where("is_deleted", false))
      .fetch()

    const animalIds = animals.map((a) => a.id)
    if (animalIds.length > 0) {
      await moveAnimalsOut(pastureId, animalIds, notes)
    }
  }

  return {
    createPasture,
    updatePasture,
    deletePasture,
    togglePastureActive,
    moveAnimalsIn,
    moveAnimalsOut,
    moveAllAnimalsOut,
  }
}
