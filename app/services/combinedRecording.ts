import type { Database, Model } from "@nozbe/watermelondb"
import { Q } from "@nozbe/watermelondb"

import type { HealthRecord, HealthRecordType } from "@/db/models/HealthRecord"
import type { ScheduledVaccination } from "@/db/models/ScheduledVaccination"
import type { WeightRecord } from "@/db/models/WeightRecord"

export interface CombinedRecordingData {
  animalId: string
  recordDate: Date
  weightKg: number
  conditionScore?: number
  protocolId: string
  recordType: HealthRecordType
  description: string
  productName: string
  dosage: string
}

/** Both observations and their vaccination linkage commit in the same local transaction. */
export async function saveWeightAndTreatment(
  database: Database,
  organizationId: string,
  author: { id?: string; name?: string },
  data: CombinedRecordingData,
) {
  if (
    !Number.isFinite(data.weightKg) ||
    data.weightKg <= 0 ||
    (data.conditionScore !== undefined &&
      (!Number.isInteger(data.conditionScore) ||
        data.conditionScore < 1 ||
        data.conditionScore > 9))
  ) {
    throw new Error("Invalid weight or condition score")
  }
  return database.write(async () => {
    const weight = database.get<WeightRecord>("weight_records").prepareCreate((record) => {
      record.organizationId = organizationId
      record.animalId = data.animalId
      record.recordDate = data.recordDate
      record.weightKg = data.weightKg
      record.conditionScore = data.conditionScore ?? null
      record.notes = null
      record.createdByUserId = author.id ?? null
      record.createdByName = author.name ?? null
      record.isDeleted = false
    })
    const health = database.get<HealthRecord>("health_records").prepareCreate((record) => {
      record.organizationId = organizationId
      record.animalId = data.animalId
      record.protocolId = data.protocolId
      record.recordDate = data.recordDate
      record.recordType = data.recordType
      record.description = data.description
      record.productName = data.productName
      record.dosage = data.dosage
      record.administeredBy = null
      record.withdrawalDate = null
      record.notes = null
      record.createdByUserId = author.id ?? null
      record.createdByName = author.name ?? null
      record.isDeleted = false
    })
    const operations: Model[] = [weight, health]
    if (data.recordType === "vaccination") {
      const vaccinations = await database
        .get<ScheduledVaccination>("scheduled_vaccinations")
        .query(
          Q.where("organization_id", organizationId),
          Q.where("animal_id", data.animalId),
          Q.where("status", "pending"),
          Q.where("is_deleted", false),
        )
        .fetch()
      for (const vaccination of vaccinations) {
        const schedule = await vaccination.schedule.fetch()
        if (schedule.protocolId !== data.protocolId) continue
        operations.push(
          vaccination.prepareUpdate((record) => {
            record.status = "administered"
            record.administeredDate = data.recordDate
            record.healthRecordId = health.id
          }),
        )
        if (schedule.requiresBooster && vaccination.doseNumber < schedule.boosterCount) {
          const dueDate = new Date(data.recordDate)
          dueDate.setDate(dueDate.getDate() + (schedule.boosterIntervalDays || 21))
          operations.push(
            database.get<ScheduledVaccination>("scheduled_vaccinations").prepareCreate((record) => {
              record.organizationId = organizationId
              record.animalId = data.animalId
              record.scheduleId = vaccination.scheduleId
              record.status = "pending"
              record.dueDate = dueDate
              record.doseNumber = vaccination.doseNumber + 1
              record.parentVaccinationId = vaccination.id
              record.isDeleted = false
            }),
          )
        }
        break
      }
    }
    await database.batch(...operations)
    return { weight, health }
  })
}
