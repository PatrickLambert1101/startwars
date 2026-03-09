import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators"

export type HealthRecordType = "vaccination" | "treatment" | "vet_visit" | "condition_score" | "other"

export class HealthRecord extends Model {
  static table = "health_records"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    animals: { type: "belongs_to" as const, key: "animal_id" },
    treatment_protocols: { type: "belongs_to" as const, key: "protocol_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("animal_id") animalId!: string
  @field("protocol_id") protocolId!: string | null
  @date("record_date") recordDate!: Date
  @field("record_type") recordType!: HealthRecordType
  @field("description") description!: string
  @field("product_name") productName!: string | null
  @field("dosage") dosage!: string | null
  @field("administered_by") administeredBy!: string | null
  @date("withdrawal_date") withdrawalDate!: Date | null
  @field("notes") notes!: string | null
  @field("created_by_user_id") createdByUserId!: string | null
  @field("created_by_name") createdByName!: string | null
  @field("photos") photos!: string | null // JSON array of photo objects
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("animals", "animal_id") animal: any
  @relation("treatment_protocols", "protocol_id") protocol: any
}
