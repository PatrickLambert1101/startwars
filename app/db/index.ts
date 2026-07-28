import { Database } from "@nozbe/watermelondb"
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite"

import { schema, migrations } from "./schema"
import { Organization, Animal, HealthRecord, WeightRecord, BreedingRecord, TreatmentProtocol, Pasture, PastureMovement, PastureActivity, PastureBoundary, OrganizationMember, VaccinationSchedule, ScheduledVaccination, ReportTemplate } from "./models"
import { logDatabaseOperation, captureException } from "@/services/sentry"

// Use SQLite adapter for reliable persistence on native platforms
// This fixes the LokiJS reset bug that was wiping data on every refresh
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // Any device DB below v3 (the lowest toVersion in migrations) cannot be
  // migrated forward — WatermelonDB will wipe and recreate at the current
  // schema version instead of throwing.
  migrationsEnabledAtVersion: 3,
  jsi: false,
  onSetUpError: (error) => {
    console.error("[DB] Setup error:", error)

    // Capture database setup errors in Sentry with rich context
    captureException(error, {
      component: "SQLiteAdapter",
      schemaVersion: schema.version,
    })

    logDatabaseOperation("reset", {
      error,
    })
  },
})

console.log("[DB] Initializing WatermelonDB with schema version:", schema.version)

export const database = new Database({
  adapter,
  modelClasses: [Organization, Animal, HealthRecord, WeightRecord, BreedingRecord, TreatmentProtocol, Pasture, PastureMovement, PastureActivity, PastureBoundary, OrganizationMember, VaccinationSchedule, ScheduledVaccination, ReportTemplate],
})

console.log("[DB] WatermelonDB initialized successfully with", Object.keys(database.collections).length, "collections")

export { schema } from "./schema"
export * from "./models"
