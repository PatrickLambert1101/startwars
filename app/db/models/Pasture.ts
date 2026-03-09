import { Model, Query } from "@nozbe/watermelondb"
import { field, date, readonly, relation, children } from "@nozbe/watermelondb/decorators"

export class Pasture extends Model {
  static table = "pastures"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    pasture_movements: { type: "has_many" as const, foreignKey: "pasture_id" },
    animals: { type: "has_many" as const, foreignKey: "current_pasture_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("name") name!: string
  @field("code") code!: string
  @field("size_hectares") sizeHectares!: number | null
  @field("location_notes") locationNotes!: string | null
  @field("forage_type") forageType!: string | null
  @field("water_source") waterSource!: string | null
  @field("fence_type") fenceType!: string | null
  @field("has_salt_blocks") hasSaltBlocks!: boolean | null
  @field("has_mineral_feeders") hasMineralFeeders!: boolean | null
  @field("max_capacity") maxCapacity!: number | null
  @field("target_grazing_days") targetGrazingDays!: number | null
  @field("target_rest_days") targetRestDays!: number | null
  @field("current_animal_count") currentAnimalCount!: number
  @date("last_grazed_date") lastGrazedDate!: Date | null
  @date("available_from_date") availableFromDate!: Date | null
  @field("is_active") isActive!: boolean
  @field("notes") notes!: string | null
  @field("photos") photos!: string | null // JSON array of photo objects
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @children("pasture_movements") movements!: Query<Model>
  @children("animals") currentAnimals!: Query<Model>

  get isOccupied(): boolean {
    return this.currentAnimalCount > 0
  }

  get isOverCapacity(): boolean {
    return this.maxCapacity !== null && this.currentAnimalCount > this.maxCapacity
  }

  get daysGrazed(): number {
    if (!this.lastGrazedDate || !this.isOccupied) return 0
    const now = new Date()
    const diff = now.getTime() - this.lastGrazedDate.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  get shouldRotate(): boolean {
    if (!this.targetGrazingDays || !this.isOccupied) return false
    return this.daysGrazed >= this.targetGrazingDays
  }

  get statusColor(): "green" | "yellow" | "red" {
    if (!this.isOccupied) return "green"
    if (this.shouldRotate || this.isOverCapacity) return "red"
    if (this.targetGrazingDays && this.daysGrazed > this.targetGrazingDays * 0.7) return "yellow"
    return "green"
  }

  get statusLabel(): string {
    if (!this.isOccupied) return "Empty"
    if (this.isOverCapacity) return "Over Capacity"
    if (this.shouldRotate) return "Needs Rotation"
    if (this.statusColor === "yellow") return "In Use"
    return "In Use"
  }

  get occupancyPercentage(): number {
    if (!this.maxCapacity || this.maxCapacity === 0) return 0
    return Math.min(100, Math.round((this.currentAnimalCount / this.maxCapacity) * 100))
  }

  get grazingProgress(): number {
    if (!this.targetGrazingDays || !this.isOccupied) return 0
    return Math.min(100, Math.round((this.daysGrazed / this.targetGrazingDays) * 100))
  }
}
