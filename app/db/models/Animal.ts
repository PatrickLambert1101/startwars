import { Model, Query } from "@nozbe/watermelondb"
import { field, date, readonly, relation, children, lazy } from "@nozbe/watermelondb/decorators"

export type AnimalSex = "bull" | "cow" | "steer" | "heifer" | "calf"
export type AnimalStatus = "active" | "sold" | "deceased" | "transferred"

export class Animal extends Model {
  static table = "animals"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    health_records: { type: "has_many" as const, foreignKey: "animal_id" },
    weight_records: { type: "has_many" as const, foreignKey: "animal_id" },
    breeding_records: { type: "has_many" as const, foreignKey: "animal_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("rfid_tag") rfidTag!: string
  @field("visual_tag") visualTag!: string
  @field("name") name!: string | null
  @field("breed") breed!: string
  @field("sex") sex!: AnimalSex
  @date("date_of_birth") dateOfBirth!: Date | null
  @field("sire_id") sireId!: string | null
  @field("dam_id") damId!: string | null
  @field("registration_number") registrationNumber!: string | null
  @field("status") status!: AnimalStatus
  @field("notes") notes!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any

  @children("health_records") healthRecords!: Query<Model>
  @children("weight_records") weightRecords!: Query<Model>
  @children("breeding_records") breedingRecords!: Query<Model>

  @lazy sire = this.collections.get("animals").findAndObserve(this.sireId!)
  @lazy dam = this.collections.get("animals").findAndObserve(this.damId!)

  get displayName(): string {
    return this.name || this.visualTag || this.rfidTag
  }
}
