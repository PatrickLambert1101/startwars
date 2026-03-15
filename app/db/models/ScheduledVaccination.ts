import { Model } from "@nozbe/watermelondb"
import { field, readonly, date, relation } from "@nozbe/watermelondb/decorators"

export type VaccinationStatus = "pending" | "administered" | "overdue" | "skipped"

export class ScheduledVaccination extends Model {
  static table = "scheduled_vaccinations"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    animals: { type: "belongs_to" as const, key: "animal_id" },
    vaccination_schedules: { type: "belongs_to" as const, key: "schedule_id" },
    health_records: { type: "belongs_to" as const, key: "health_record_id" },
  }

  @field("remote_id") remoteId!: string | null
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
    const now = new Date()
    return this.dueDate < now
  }

  get daysOverdue(): number {
    if (!this.isOverdue) return 0
    const now = new Date()
    const diff = now.getTime() - this.dueDate.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  get daysUntilDue(): number {
    const now = new Date()
    const diff = this.dueDate.getTime() - now.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  get urgencyLevel(): "ok" | "soon" | "overdue" | "critical" {
    if (this.status !== "pending") return "ok"

    const days = this.daysUntilDue
    if (days < 0 && Math.abs(days) > 7) return "critical"
    if (days < 0) return "overdue"
    if (days <= 7) return "soon"
    return "ok"
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
