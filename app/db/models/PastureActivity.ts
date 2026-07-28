import { Model } from "@nozbe/watermelondb"
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators"

export type PastureActivityType =
  | "burning"
  | "slashing"
  | "brush_cutting"
  | "chainsaw"
  | "invasive_clearing"
  | "tick_observation"
  | "other"

export const PASTURE_ACTIVITY_TYPES: PastureActivityType[] = [
  "burning",
  "slashing",
  "brush_cutting",
  "chainsaw",
  "invasive_clearing",
  "tick_observation",
  "other",
]

export const PASTURE_ACTIVITY_LABELS: Record<PastureActivityType, string> = {
  burning: "Burning",
  slashing: "Slashing",
  brush_cutting: "Brush cutting",
  chainsaw: "Chainsaw work",
  invasive_clearing: "Invasive species clearing",
  tick_observation: "Tick observation",
  other: "Other",
}

export const TICK_LOAD_OPTIONS = [
  { score: 0, label: "None" },
  { score: 1, label: "Very low" },
  { score: 2, label: "Low" },
  { score: 3, label: "Moderate" },
  { score: 4, label: "High" },
  { score: 5, label: "Very high" },
] as const

export class PastureActivity extends Model {
  static table = "pasture_activities"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    pastures: { type: "belongs_to" as const, key: "pasture_id" },
  }

  @field("organization_id") organizationId!: string
  @field("pasture_id") pastureId!: string
  @date("activity_date") activityDate!: Date
  @field("activity_type") activityType!: PastureActivityType
  @field("target_species") targetSpecies!: string | null
  @field("area_hectares") areaHectares!: number | null
  @field("performed_by") performedBy!: string | null
  @field("notes") notes!: string | null
  @field("photos") photos!: string | null
  @field("tick_load_score") tickLoadScore!: number | null
  @field("animals_inspected") animalsInspected!: number | null
  @field("created_by_user_id") createdByUserId!: string | null
  @field("created_by_name") createdByName!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @relation("pastures", "pasture_id") pasture: any
}
