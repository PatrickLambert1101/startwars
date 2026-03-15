import { useEffect, useState, useCallback } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { VaccinationSchedule, ScheduleType, ScheduledVaccination, VaccinationStatus } from "@/db/models"
import { useDatabase } from "@/context/DatabaseContext"

export type VaccinationScheduleFormData = {
  protocolId: string
  name: string
  description?: string
  scheduleType: ScheduleType
  // Age-based
  targetAgeMonths?: number
  ageWindowDays?: number
  // Date-based
  scheduledDate?: Date
  repeatAnnually?: boolean
  // Group-based
  pastureId?: string
  intervalMonths?: number
  // Filters
  targetSpecies?: string
  targetSex?: string
  minAgeMonths?: number
  maxAgeMonths?: number
  // Booster
  requiresBooster: boolean
  boosterIntervalDays?: number
  boosterCount: number
}

/**
 * Hook to get all vaccination schedules for the current organization
 */
export function useVaccinationSchedules() {
  const { currentOrg } = useDatabase()
  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setSchedules([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<VaccinationSchedule>("vaccination_schedules")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.sortBy("name", Q.asc),
      )
      .observe()
      .subscribe((results) => {
        setSchedules(results)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { schedules, isLoading }
}

/**
 * Hook to get active vaccination schedules only
 */
export function useActiveVaccinationSchedules() {
  const { currentOrg } = useDatabase()
  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setSchedules([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<VaccinationSchedule>("vaccination_schedules")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.where("is_active", true),
        Q.sortBy("name", Q.asc),
      )
      .observe()
      .subscribe((results) => {
        setSchedules(results)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { schedules, isLoading }
}

/**
 * Hook to get a specific vaccination schedule
 */
export function useVaccinationSchedule(scheduleId: string) {
  const [schedule, setSchedule] = useState<VaccinationSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!scheduleId) {
      setSchedule(null)
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<VaccinationSchedule>("vaccination_schedules")
      .findAndObserve(scheduleId)
      .subscribe((result) => {
        setSchedule(result)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [scheduleId])

  return { schedule, isLoading }
}

/**
 * Hook for vaccination schedule actions
 */
export function useVaccinationScheduleActions() {
  const { currentOrg } = useDatabase()

  const createSchedule = useCallback(
    async (data: VaccinationScheduleFormData) => {
      if (!currentOrg) throw new Error("No organization selected")

      const schedule = await database.write(async () => {
        return await database.get<VaccinationSchedule>("vaccination_schedules").create((s) => {
          s.organizationId = currentOrg.id
          s.protocolId = data.protocolId
          s.name = data.name
          s.description = data.description || null
          s.scheduleType = data.scheduleType
          s.targetAgeMonths = data.targetAgeMonths || null
          s.ageWindowDays = data.ageWindowDays || 7 // default ±7 days
          s.scheduledDate = data.scheduledDate || null
          s.repeatAnnually = data.repeatAnnually || false
          s.pastureId = data.pastureId || null
          s.intervalMonths = data.intervalMonths || null
          s.lastAppliedDate = null
          s.targetSpecies = data.targetSpecies || null
          s.targetSex = data.targetSex || null
          s.minAgeMonths = data.minAgeMonths || null
          s.maxAgeMonths = data.maxAgeMonths || null
          s.requiresBooster = data.requiresBooster
          s.boosterIntervalDays = data.boosterIntervalDays || null
          s.boosterCount = data.boosterCount
          s.isActive = true
          s.isDeleted = false
        })
      })

      return schedule
    },
    [currentOrg],
  )

  const updateSchedule = useCallback(
    async (scheduleId: string, data: Partial<VaccinationScheduleFormData>) => {
      await database.write(async () => {
        const schedule = await database.get<VaccinationSchedule>("vaccination_schedules").find(scheduleId)
        await schedule.update((s) => {
          if (data.name !== undefined) s.name = data.name
          if (data.description !== undefined) s.description = data.description || null
          if (data.scheduleType !== undefined) s.scheduleType = data.scheduleType
          if (data.targetAgeMonths !== undefined) s.targetAgeMonths = data.targetAgeMonths || null
          if (data.ageWindowDays !== undefined) s.ageWindowDays = data.ageWindowDays || null
          if (data.scheduledDate !== undefined) s.scheduledDate = data.scheduledDate || null
          if (data.repeatAnnually !== undefined) s.repeatAnnually = data.repeatAnnually
          if (data.pastureId !== undefined) s.pastureId = data.pastureId || null
          if (data.intervalMonths !== undefined) s.intervalMonths = data.intervalMonths || null
          if (data.targetSpecies !== undefined) s.targetSpecies = data.targetSpecies || null
          if (data.targetSex !== undefined) s.targetSex = data.targetSex || null
          if (data.minAgeMonths !== undefined) s.minAgeMonths = data.minAgeMonths || null
          if (data.maxAgeMonths !== undefined) s.maxAgeMonths = data.maxAgeMonths || null
          if (data.requiresBooster !== undefined) s.requiresBooster = data.requiresBooster
          if (data.boosterIntervalDays !== undefined) s.boosterIntervalDays = data.boosterIntervalDays || null
          if (data.boosterCount !== undefined) s.boosterCount = data.boosterCount
        })
      })
    },
    [],
  )

  const toggleScheduleActive = useCallback(async (scheduleId: string) => {
    await database.write(async () => {
      const schedule = await database.get<VaccinationSchedule>("vaccination_schedules").find(scheduleId)
      await schedule.update((s) => {
        s.isActive = !s.isActive
      })
    })
  }, [])

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    await database.write(async () => {
      const schedule = await database.get<VaccinationSchedule>("vaccination_schedules").find(scheduleId)
      await schedule.update((s) => {
        s.isDeleted = true
      })
    })
  }, [])

  return {
    createSchedule,
    updateSchedule,
    toggleScheduleActive,
    deleteSchedule,
  }
}

/**
 * Hook to get scheduled vaccinations (for an animal or organization)
 * Fetches related schedule and protocol data for display
 */
export function useScheduledVaccinations(animalId?: string) {
  const { currentOrg } = useDatabase()
  const [vaccinations, setVaccinations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setVaccinations([])
      setIsLoading(false)
      return
    }

    const queryConditions = [
      Q.where("organization_id", currentOrg.id),
      Q.where("is_deleted", false),
    ]

    if (animalId) {
      queryConditions.push(Q.where("animal_id", animalId))
    }

    const subscription = database
      .get<ScheduledVaccination>("scheduled_vaccinations")
      .query(...queryConditions, Q.sortBy("due_date", Q.asc))
      .observe()
      .subscribe(async (results) => {
        // Fetch related schedule and protocol for each vaccination
        const vaccinationsWithSchedules = await Promise.all(
          results.map(async (vaccination) => {
            try {
              const schedule = await vaccination.schedule.fetch()
              const protocol = schedule ? await schedule.protocol.fetch() : null
              return {
                // Copy all vaccination properties
                id: vaccination.id,
                animalId: vaccination.animalId,
                scheduleId: vaccination.scheduleId,
                status: vaccination.status,
                dueDate: vaccination.dueDate,
                administeredDate: vaccination.administeredDate,
                doseNumber: vaccination.doseNumber,
                parentVaccinationId: vaccination.parentVaccinationId,
                urgencyLevel: vaccination.urgencyLevel,
                daysUntilDue: vaccination.daysUntilDue,
                isOverdue: vaccination.isOverdue,
                // Add enriched data
                schedule: schedule ? {
                  id: schedule.id,
                  name: schedule.name,
                  description: schedule.description,
                  requiresBooster: schedule.requiresBooster,
                  boosterCount: schedule.boosterCount,
                  boosterIntervalDays: schedule.boosterIntervalDays,
                  protocol: protocol ? {
                    id: protocol.id,
                    productName: protocol.productName,
                  } : null,
                } : null,
              }
            } catch (error) {
              console.error("[useScheduledVaccinations] Failed to fetch schedule:", error)
              return null
            }
          })
        )
        setVaccinations(vaccinationsWithSchedules.filter(Boolean))
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg, animalId])

  return { vaccinations, isLoading }
}

/**
 * Hook to get pending vaccinations (due or overdue)
 * Fetches related schedule, protocol, and animal data for display
 */
export function usePendingVaccinations() {
  const { currentOrg } = useDatabase()
  const [vaccinations, setVaccinations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setVaccinations([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<ScheduledVaccination>("scheduled_vaccinations")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.where("status", "pending"),
        Q.sortBy("due_date", Q.asc),
      )
      .observe()
      .subscribe(async (results) => {
        // Fetch related data for each vaccination
        const vaccinationsWithData = await Promise.all(
          results.map(async (vaccination) => {
            try {
              const schedule = await vaccination.schedule.fetch()
              const protocol = schedule ? await schedule.protocol.fetch() : null
              const animal = await vaccination.animal.fetch()
              return {
                // Copy all vaccination properties
                id: vaccination.id,
                animalId: vaccination.animalId,
                scheduleId: vaccination.scheduleId,
                status: vaccination.status,
                dueDate: vaccination.dueDate,
                administeredDate: vaccination.administeredDate,
                doseNumber: vaccination.doseNumber,
                parentVaccinationId: vaccination.parentVaccinationId,
                urgencyLevel: vaccination.urgencyLevel,
                daysUntilDue: vaccination.daysUntilDue,
                isOverdue: vaccination.isOverdue,
                // Add enriched data
                schedule: schedule ? {
                  id: schedule.id,
                  name: schedule.name,
                  description: schedule.description,
                  requiresBooster: schedule.requiresBooster,
                  boosterCount: schedule.boosterCount,
                  protocol: protocol ? {
                    id: protocol.id,
                    productName: protocol.productName,
                  } : null,
                } : null,
                animal: animal ? {
                  id: animal.id,
                  displayName: animal.displayName,
                  visualTag: animal.visualTag,
                } : null,
              }
            } catch (error) {
              console.error("[usePendingVaccinations] Failed to fetch related data:", error)
              return null
            }
          })
        )
        setVaccinations(vaccinationsWithData.filter(Boolean))
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { vaccinations, isLoading }
}

/**
 * Hook for scheduled vaccination actions
 */
export function useScheduledVaccinationActions() {
  const { currentOrg } = useDatabase()

  const markAsAdministered = useCallback(
    async (vaccinationId: string, healthRecordId: string) => {
      if (!currentOrg) throw new Error("No organization selected")

      await database.write(async () => {
        const vaccination = await database.get<ScheduledVaccination>("scheduled_vaccinations").find(vaccinationId)
        const schedule = await database.get<VaccinationSchedule>("vaccination_schedules").find(vaccination.scheduleId)

        await vaccination.update((v) => {
          v.status = "administered"
          v.administeredDate = new Date()
          v.healthRecordId = healthRecordId
        })

        // If booster required, create next dose
        if (schedule.requiresBooster && vaccination.doseNumber < schedule.boosterCount) {
          const boosterDueDate = new Date()
          boosterDueDate.setDate(boosterDueDate.getDate() + (schedule.boosterIntervalDays || 21))

          await database.get<ScheduledVaccination>("scheduled_vaccinations").create((v) => {
            v.organizationId = currentOrg.id
            v.animalId = vaccination.animalId
            v.scheduleId = vaccination.scheduleId
            v.status = "pending"
            v.dueDate = boosterDueDate
            v.doseNumber = vaccination.doseNumber + 1
            v.parentVaccinationId = vaccinationId
            v.isDeleted = false
          })
        }
      })
    },
    [currentOrg],
  )

  const markAsSkipped = useCallback(async (vaccinationId: string, reason: string) => {
    await database.write(async () => {
      const vaccination = await database.get<ScheduledVaccination>("scheduled_vaccinations").find(vaccinationId)
      await vaccination.update((v) => {
        v.status = "skipped"
        v.skippedReason = reason
      })
    })
  }, [])

  return {
    markAsAdministered,
    markAsSkipped,
  }
}
