import { Database } from "@nozbe/watermelondb"
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite"

import { schema, migrations } from "./schema"
import { Organization, Animal, HealthRecord, WeightRecord, BreedingRecord, TreatmentProtocol, Pasture, PastureMovement, OrganizationMember, VaccinationSchedule, ScheduledVaccination } from "./models"

// Use SQLite adapter for reliable persistence on native platforms
// This fixes the LokiJS reset bug that was wiping data on every refresh
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: false,
  onSetUpError: (error) => {
    console.error("[DB] Setup error:", error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [Organization, Animal, HealthRecord, WeightRecord, BreedingRecord, TreatmentProtocol, Pasture, PastureMovement, OrganizationMember, VaccinationSchedule, ScheduledVaccination],
})

export { schema } from "./schema"
export * from "./models"
