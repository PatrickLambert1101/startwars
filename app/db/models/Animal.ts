import { Model, Query } from "@nozbe/watermelondb"
import { field, date, readonly, relation, children, lazy } from "@nozbe/watermelondb/decorators"
import type { LivestockType } from "./Organization"

export type AnimalSpecies = LivestockType

export type AnimalSex = "male" | "female" | "castrated" | "unknown"

export type AnimalStatus = "active" | "sold" | "deceased" | "transferred"

/**
 * Species-specific sex labels for display
 */
export const SEX_LABELS: Record<AnimalSpecies, Record<AnimalSex, string>> = {
  cattle: { male: "Bull", female: "Cow", castrated: "Steer/Ox", unknown: "Unknown" },
  buffalo: { male: "Bull", female: "Cow", castrated: "Steer", unknown: "Unknown" },
  horses: { male: "Stallion", female: "Mare", castrated: "Gelding", unknown: "Unknown" },
  sheep: { male: "Ram", female: "Ewe", castrated: "Wether", unknown: "Unknown" },
  goats: { male: "Buck", female: "Doe", castrated: "Wether", unknown: "Unknown" },
  game: { male: "Male", female: "Female", castrated: "Castrated", unknown: "Unknown" },
  pigs: { male: "Boar", female: "Sow", castrated: "Barrow", unknown: "Unknown" },
  poultry: { male: "Cock", female: "Hen", castrated: "Capon", unknown: "Unknown" },
}

/**
 * Common breeds by species (South Africa focused)
 */
export const BREEDS_BY_SPECIES: Record<AnimalSpecies, string[]> = {
  cattle: ["Nguni", "Bonsmara", "Brahman", "Angus", "Hereford", "Simmentaler", "Drakensberger", "Afrikaner", "Sussex", "Limousin", "Charolais", "Beefmaster", "Sanga", "Tuli", "Mixed"],
  buffalo: ["Cape Buffalo", "Water Buffalo", "Mixed"],
  horses: ["Boerperd", "Nooitgedachter", "SA Warmblood", "Thoroughbred", "Arabian", "Friesian", "Appaloosa", "Quarter Horse", "Percheron", "Mixed"],
  sheep: ["Dorper", "Merino", "Damara", "Dohne Merino", "Ile de France", "Suffolk", "Dormer", "Meatmaster", "Van Rooy", "Blackhead Persian", "Mixed"],
  goats: ["Boer Goat", "Angora", "Kalahari Red", "Savanna", "Toggenburg", "Saanen", "Indigenous Veld", "Mixed"],
  game: ["Springbok", "Impala", "Kudu", "Blesbok", "Blue Wildebeest", "Gemsbok", "Eland", "Nyala", "Sable", "Waterbuck", "Bushbuck", "Mixed"],
  pigs: ["Large White", "Landrace", "Duroc", "Kolbroek", "Windsnyer", "SA Landrace", "Mixed"],
  poultry: ["Boschveld", "Potchefstroom Koekoek", "Rhodes Island Red", "Venda", "Ovambo", "Mixed"],
}

export class Animal extends Model {
  static table = "animals"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    pastures: { type: "belongs_to" as const, key: "current_pasture_id" },
    health_records: { type: "has_many" as const, foreignKey: "animal_id" },
    weight_records: { type: "has_many" as const, foreignKey: "animal_id" },
    breeding_records: { type: "has_many" as const, foreignKey: "animal_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("species") species!: AnimalSpecies
  @field("rfid_tag") rfidTag!: string
  @field("visual_tag") visualTag!: string
  @field("name") name!: string | null
  @field("breed") breed!: string
  @field("sex") sex!: AnimalSex
  @date("date_of_birth") dateOfBirth!: Date | null
  @field("sire_id") sireId!: string | null
  @field("dam_id") damId!: string | null
  @field("registration_number") registrationNumber!: string | null
  @field("current_pasture_id") currentPastureId!: string | null
  @field("status") status!: AnimalStatus
  @field("herd_tag") herdTag!: string | null
  @field("notes") notes!: string | null
  @field("photos") photos!: string | null // JSON array of photo objects
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @relation("pastures", "current_pasture_id") currentPasture: any

  @children("health_records") healthRecords!: Query<Model>
  @children("weight_records") weightRecords!: Query<Model>
  @children("breeding_records") breedingRecords!: Query<Model>

  @lazy sire = this.collections.get("animals").findAndObserve(this.sireId!)
  @lazy dam = this.collections.get("animals").findAndObserve(this.damId!)

  get displayName(): string {
    return this.name || this.visualTag || this.rfidTag
  }

  get sexLabel(): string {
    return SEX_LABELS[this.species]?.[this.sex] ?? this.sex
  }
}
