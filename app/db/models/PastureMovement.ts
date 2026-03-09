import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators"

export type MovementType = "move_in" | "move_out"

export class PastureMovement extends Model {
  static table = "pasture_movements"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    pastures: { type: "belongs_to" as const, key: "pasture_id" },
    animals: { type: "belongs_to" as const, key: "animal_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("pasture_id") pastureId!: string
  @field("animal_id") animalId!: string
  @date("movement_date") movementDate!: Date
  @field("movement_type") movementType!: MovementType
  @field("moved_by") movedBy!: string | null
  @field("notes") notes!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @relation("pastures", "pasture_id") pasture: any
  @relation("animals", "animal_id") animal: any

  get isMovingIn(): boolean {
    return this.movementType === "move_in"
  }

  get isMovingOut(): boolean {
    return this.movementType === "move_out"
  }
}
