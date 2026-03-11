import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, children, json } from "@nozbe/watermelondb/decorators"

export type LivestockType = "cattle" | "buffalo" | "horses" | "sheep" | "goats" | "game" | "pigs" | "poultry"

const sanitizeLivestockTypes = (raw: any): LivestockType[] => {
  if (Array.isArray(raw)) return raw
  return []
}

const sanitizeDefaultBreeds = (raw: any): Partial<Record<LivestockType, string>> => {
  if (raw && typeof raw === 'object') return raw
  return {}
}

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
  @json("livestock_types", sanitizeLivestockTypes) livestockTypes!: LivestockType[]
  @field("location") location!: string | null
  @json("default_breeds", sanitizeDefaultBreeds) defaultBreeds!: Partial<Record<LivestockType, string>>
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @children("animals") animals: any
}
