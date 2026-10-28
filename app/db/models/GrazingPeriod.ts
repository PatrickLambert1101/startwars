import { Model } from "@nozbe/watermelondb"
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators"

export class GrazingPeriod extends Model {
  static table = "grazing_periods"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    pastures: { type: "belongs_to" as const, key: "pasture_id" },
  }

  @field("organization_id") organizationId!: string
  @field("pasture_id") pastureId!: string
  @date("start_date") startDate!: Date
  @date("end_date") endDate!: Date | null
  @field("herd_group") herdGroup!: string | null
  @field("animal_count") animalCount!: number | null
  @field("notes") notes!: string | null
  @field("source_file_name") sourceFileName!: string | null
  @field("created_by_user_id") createdByUserId!: string | null
  @field("created_by_name") createdByName!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @relation("pastures", "pasture_id") pasture: any
}
