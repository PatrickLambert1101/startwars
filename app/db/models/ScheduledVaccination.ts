import { Model } from "@nozbe/watermelondb"
import { field, readonly, date, relation } from "@nozbe/watermelondb/decorators"

import {
  getVaccinationDaysUntilDue,
  getVaccinationUrgency,
  type VaccinationUrgency,
} from "@/utils/vaccinationDates"

export type VaccinationStatus = "pending" | "administered" | "overdue" | "skipped"

export class ScheduledVaccination extends Model {
  static table = "scheduled_vaccinations"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    animals: { type: "belongs_to" as const, key: "animal_id" },
    vaccination_schedules: { type: "belongs_to" as const, key: "schedule_id" },
    health_records: { type: "belongs_to" as const, key: "health_record_id" },
  }

  @field("organization_id") organizationId!: string
  @field("animal_id") animalId!: string
  @field("schedule_id") scheduleId!: string
  @field("health_record_id") healthRecordId!: string | null // Links to actual health record when administered

  @field("status") status!: VaccinationStatus
  @date("due_date") dueDate!: Date
  @date("administered_date") administeredDate!: Date | null

  // Booster tracking
  @field("dose_number") doseNumber!: number // 1 = initial, 2 = first booster, etc.
  @date("booster_due_date") boosterDueDate!: Date | null
  @field("parent_vaccination_id") parentVaccinationId!: string | null // Links to initial dose for boosters

  @field("skipped_reason") skippedReason!: string | null
  @field("notes") notes!: string | null

  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @relation("animals", "animal_id") animal: any
  @relation("vaccination_schedules", "schedule_id") schedule: any
  @relation("health_records", "health_record_id") healthRecord: any

  get isOverdue(): boolean {
    if (this.status !== "pending") return false
    return this.daysUntilDue < 0
  }

  get daysOverdue(): number {
    return Math.max(0, -this.daysUntilDue)
  }

  get daysUntilDue(): number {
    return getVaccinationDaysUntilDue(this.dueDate)
  }

  get urgencyLevel(): VaccinationUrgency {
    return getVaccinationUrgency(this.status, this.dueDate)
  }

  get displayStatus(): string {
    switch (this.status) {
      case "pending":
        if (this.isOverdue) return `Overdue (${this.daysOverdue}d)`
        return `Due in ${this.daysUntilDue}d`
      case "administered":
        return "Completed"
      case "overdue":
        return "Overdue"
      case "skipped":
        return "Skipped"
      default:
        return this.status
    }
  }
}
