import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators"

export class WeightRecord extends Model {
  static table = "weight_records"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    animals: { type: "belongs_to" as const, key: "animal_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("animal_id") animalId!: string
  @date("record_date") recordDate!: Date
  @field("weight_kg") weightKg!: number
  @field("condition_score") conditionScore!: number | null
  @field("notes") notes!: string | null
  @field("created_by_user_id") createdByUserId!: string | null
  @field("created_by_name") createdByName!: string | null
  @field("photos") photos!: string | null // JSON array of photo objects
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("animals", "animal_id") animal: any
}
