import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { HealthRecord, HealthRecordType } from "@/db/models/HealthRecord"
import { WeightRecord } from "@/db/models/WeightRecord"
import { BreedingRecord, BreedingMethod, BreedingOutcome } from "@/db/models/BreedingRecord"
import { ScheduledVaccination } from "@/db/models"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"

// --- Health Records ---

export type HealthRecordFormData = {
  animalId: string
  recordDate: Date
  recordType: HealthRecordType
  description: string
  productName?: string
  dosage?: string
  administeredBy?: string
  withdrawalDate?: Date
  notes?: string
  protocolId?: string
}

export function useHealthRecords(animalId: string) {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!animalId) { setIsLoading(false); return }

    const sub = database.get<HealthRecord>("health_records")
      .query(Q.where("animal_id", animalId), Q.where("is_deleted", false), Q.sortBy("record_date", Q.desc))
      .observe()
      .subscribe((r) => { setRecords(r); setIsLoading(false) })

    return () => sub.unsubscribe()
  }, [animalId])

  return { records, isLoading }
}

export function useHealthRecordActions() {
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const createHealthRecord = async (data: HealthRecordFormData) => {
    if (!currentOrg) throw new Error("No organization selected")

    const healthRecord = await database.write(async () => {
      return database.get<HealthRecord>("health_records").create((r) => {
        r.organizationId = currentOrg.id
        r.animalId = data.animalId
        r.protocolId = data.protocolId ?? null
        r.recordDate = data.recordDate
        r.recordType = data.recordType
        r.description = data.description
        r.productName = data.productName ?? null
        r.dosage = data.dosage ?? null
        r.administeredBy = data.administeredBy ?? null
        r.withdrawalDate = data.withdrawalDate ?? null
        r.notes = data.notes ?? null
        r.createdByUserId = user?.id ?? null
        r.createdByName = user?.email ?? null
        r.isDeleted = false
      })
    })

    // If this is a vaccination and there's a protocol, mark matching scheduled vaccinations as administered
    if (data.recordType === "vaccination" && data.protocolId) {
      try {
        const pendingVaccinations = await database
          .get<ScheduledVaccination>("scheduled_vaccinations")
          .query(
            Q.where("animal_id", data.animalId),
            Q.where("status", "pending"),
            Q.where("is_deleted", false)
          )
          .fetch()

        // Find vaccination matching this protocol
        for (const vaccination of pendingVaccinations) {
          const schedule = await vaccination.schedule.fetch()
          if (schedule.protocolId === data.protocolId) {
            await database.write(async () => {
              await vaccination.update((v) => {
                v.status = "administered"
                v.administeredDate = data.recordDate
                v.healthRecordId = healthRecord.id
              })

              // Create booster if needed
              if (schedule.requiresBooster && vaccination.doseNumber < schedule.boosterCount) {
                const boosterDueDate = new Date(data.recordDate)
                boosterDueDate.setDate(boosterDueDate.getDate() + (schedule.boosterIntervalDays || 21))

                await database.get<ScheduledVaccination>("scheduled_vaccinations").create((v) => {
                  v.organizationId = currentOrg.id
                  v.animalId = data.animalId
                  v.scheduleId = vaccination.scheduleId
                  v.status = "pending"
                  v.dueDate = boosterDueDate
                  v.doseNumber = vaccination.doseNumber + 1
                  v.parentVaccinationId = vaccination.id
                  v.isDeleted = false
                })

                if (__DEV__) {
                  console.log("[HealthRecord] Created booster dose", vaccination.doseNumber + 1, "due", boosterDueDate.toLocaleDateString())
                }
              }
            })

            if (__DEV__) {
              console.log("[HealthRecord] Marked scheduled vaccination as administered:", schedule.name)
            }
            break // Only mark the first matching vaccination
          }
        }
      } catch (error) {
        console.error("[HealthRecord] Failed to link to scheduled vaccination:", error)
        // Don't throw - health record was created successfully, this is just a bonus feature
      }
    }

    return healthRecord
  }

  return { createHealthRecord }
}

// --- Weight Records ---

export type WeightRecordFormData = {
  animalId: string
  recordDate: Date
  weightKg: number
  conditionScore?: number
  notes?: string
}

export function useWeightRecords(animalId: string) {
  const [records, setRecords] = useState<WeightRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!animalId) { setIsLoading(false); return }

    const sub = database.get<WeightRecord>("weight_records")
      .query(Q.where("animal_id", animalId), Q.where("is_deleted", false), Q.sortBy("record_date", Q.desc))
      .observe()
      .subscribe((r) => { setRecords(r); setIsLoading(false) })

    return () => sub.unsubscribe()
  }, [animalId])

  return { records, isLoading }
}

export function useWeightRecordActions() {
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const createWeightRecord = async (data: WeightRecordFormData) => {
    if (!currentOrg) throw new Error("No organization selected")
    return database.write(async () => {
      return database.get<WeightRecord>("weight_records").create((r) => {
        r.organizationId = currentOrg.id
        r.animalId = data.animalId
        r.recordDate = data.recordDate
        r.weightKg = data.weightKg
        r.conditionScore = data.conditionScore ?? null
        r.notes = data.notes ?? null
        r.createdByUserId = user?.id ?? null
        r.createdByName = user?.email ?? null
        r.isDeleted = false
      })
    })
  }

  return { createWeightRecord }
}

// --- Breeding Records ---

export type BreedingRecordFormData = {
  animalId: string
  bullId?: string
  breedingDate: Date
  method: BreedingMethod
  expectedCalvingDate?: Date
  outcome: BreedingOutcome
  notes?: string
}

export function useBreedingRecords(animalId: string) {
  const [records, setRecords] = useState<BreedingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!animalId) { setIsLoading(false); return }

    const sub = database.get<BreedingRecord>("breeding_records")
      .query(Q.where("animal_id", animalId), Q.where("is_deleted", false), Q.sortBy("breeding_date", Q.desc))
      .observe()
      .subscribe((r) => { setRecords(r); setIsLoading(false) })

    return () => sub.unsubscribe()
  }, [animalId])

  return { records, isLoading }
}

export function useBreedingRecordActions() {
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const createBreedingRecord = async (data: BreedingRecordFormData) => {
    if (!currentOrg) throw new Error("No organization selected")
    return database.write(async () => {
      return database.get<BreedingRecord>("breeding_records").create((r) => {
        r.organizationId = currentOrg.id
        r.animalId = data.animalId
        r.bullId = data.bullId ?? null
        r.breedingDate = data.breedingDate
        r.method = data.method
        r.expectedCalvingDate = data.expectedCalvingDate ?? null
        r.outcome = data.outcome
        r.notes = data.notes ?? null
        r.createdByUserId = user?.id ?? null
        r.createdByName = user?.email ?? null
        r.isDeleted = false
      })
    })
  }

  return { createBreedingRecord }
}
