import { Model } from "@nozbe/watermelondb"
import { field, readonly, date, relation } from "@nozbe/watermelondb/decorators"

export type ProtocolType = "vaccination" | "treatment" | "deworming" | "other"

export class TreatmentProtocol extends Model {
  static table = "treatment_protocols"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    health_records: { type: "has_many" as const, foreignKey: "protocol_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("name") name!: string
  @field("description") description!: string | null
  @field("protocol_type") protocolType!: ProtocolType
  @field("product_name") productName!: string
  @field("dosage") dosage!: string
  @field("administration_method") administrationMethod!: string | null
  @field("withdrawal_days") withdrawalDays!: number | null
  @field("target_species") targetSpecies!: string
  @field("target_age_min") targetAgeMin!: number | null
  @field("target_age_max") targetAgeMax!: number | null
  @field("is_active") isActive!: boolean
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
}
