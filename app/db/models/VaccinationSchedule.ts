import { Model } from "@nozbe/watermelondb"
import { field, readonly, date, relation, children } from "@nozbe/watermelondb/decorators"
import type { Query } from "@nozbe/watermelondb"

export type ScheduleType = "age_based" | "date_based" | "group_based"

export class VaccinationSchedule extends Model {
  static table = "vaccination_schedules"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    treatment_protocols: { type: "belongs_to" as const, key: "protocol_id" },
    pastures: { type: "belongs_to" as const, key: "pasture_id" },
    scheduled_vaccinations: { type: "has_many" as const, foreignKey: "schedule_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("protocol_id") protocolId!: string
  @field("name") name!: string
  @field("description") description!: string | null

  // Schedule type and settings
  @field("schedule_type") scheduleType!: ScheduleType

  // Age-based settings
  @field("target_age_months") targetAgeMonths!: number | null // e.g., 3, 6, 12
  @field("age_window_days") ageWindowDays!: number | null // ±X days from exact age

  // Date-based settings
  @date("scheduled_date") scheduledDate!: Date | null
  @field("repeat_annually") repeatAnnually!: boolean

  // Group-based settings
  @field("pasture_id") pastureId!: string | null
  @field("interval_months") intervalMonths!: number | null // Re-vaccinate every X months
  @date("last_applied_date") lastAppliedDate!: Date | null

  // Filters
  @field("target_species") targetSpecies!: string | null // "cattle", "buffalo", etc.
  @field("target_sex") targetSex!: string | null // "male", "female", null = all
  @field("min_age_months") minAgeMonths!: number | null
  @field("max_age_months") maxAgeMonths!: number | null

  // Booster settings
  @field("requires_booster") requiresBooster!: boolean
  @field("booster_interval_days") boosterIntervalDays!: number | null // Days until 2nd dose
  @field("booster_count") boosterCount!: number // Total number of doses (1 = no booster, 2+ = requires booster)

  @field("is_active") isActive!: boolean
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @relation("treatment_protocols", "protocol_id") protocol: any
  @relation("pastures", "pasture_id") pasture: any
  @children("scheduled_vaccinations") scheduledVaccinations!: Query<Model>

  get displayName(): string {
    return this.name
  }

  get scheduleTypeLabel(): string {
    switch (this.scheduleType) {
      case "age_based":
        return `Age: ${this.targetAgeMonths} months`
      case "date_based":
        return this.scheduledDate
          ? `Date: ${this.scheduledDate.toLocaleDateString()}`
          : "Date-based"
      case "group_based":
        return `Group: Every ${this.intervalMonths} months`
      default:
        return this.scheduleType
    }
  }
}
