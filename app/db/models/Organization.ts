import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, children } from "@nozbe/watermelondb/decorators"

export class Organization extends Model {
  static table = "organizations"

  static associations = {
    animals: { type: "has_many" as const, foreignKey: "organization_id" },
    health_records: { type: "has_many" as const, foreignKey: "organization_id" },
    weight_records: { type: "has_many" as const, foreignKey: "organization_id" },
    breeding_records: { type: "has_many" as const, foreignKey: "organization_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("name") name!: string
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @children("animals") animals: any
}
