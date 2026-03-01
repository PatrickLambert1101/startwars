import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators"

export type BreedingMethod = "natural" | "ai" | "embryo_transfer"
export type BreedingOutcome = "pending" | "live_calf" | "stillborn" | "aborted" | "open"

export class BreedingRecord extends Model {
  static table = "breeding_records"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    animals: { type: "belongs_to" as const, key: "animal_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("animal_id") animalId!: string
  @field("bull_id") bullId!: string | null
  @date("breeding_date") breedingDate!: Date
  @field("method") method!: BreedingMethod
  @date("expected_calving_date") expectedCalvingDate!: Date | null
  @date("actual_calving_date") actualCalvingDate!: Date | null
  @field("calf_id") calfId!: string | null
  @field("outcome") outcome!: BreedingOutcome
  @field("notes") notes!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("animals", "animal_id") animal: any
}
