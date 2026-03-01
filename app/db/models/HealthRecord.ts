import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators"

export type HealthRecordType = "vaccination" | "treatment" | "vet_visit" | "condition_score" | "other"

export class HealthRecord extends Model {
  static table = "health_records"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    animals: { type: "belongs_to" as const, key: "animal_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("animal_id") animalId!: string
  @date("record_date") recordDate!: Date
  @field("record_type") recordType!: HealthRecordType
  @field("description") description!: string
  @field("product_name") productName!: string | null
  @field("dosage") dosage!: string | null
  @field("administered_by") administeredBy!: string | null
  @date("withdrawal_date") withdrawalDate!: Date | null
  @field("notes") notes!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("animals", "animal_id") animal: any
}
