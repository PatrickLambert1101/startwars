import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { HealthRecord, HealthRecordType } from "@/db/models/HealthRecord"
import { WeightRecord } from "@/db/models/WeightRecord"
import { BreedingRecord, BreedingMethod, BreedingOutcome } from "@/db/models/BreedingRecord"
import { useDatabase } from "@/context/DatabaseContext"

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

  const createHealthRecord = async (data: HealthRecordFormData) => {
    if (!currentOrg) throw new Error("No organization selected")
    return database.write(async () => {
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
        r.isDeleted = false
      })
    })
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
        r.isDeleted = false
      })
    })
  }

  return { createBreedingRecord }
}
