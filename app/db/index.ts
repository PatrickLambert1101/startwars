import { Database } from "@nozbe/watermelondb"
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs"

import { schema } from "./schema"
import { Organization, Animal, HealthRecord, WeightRecord, BreedingRecord } from "./models"

// Use LokiJS adapter — works on all platforms (iOS, Android, Web)
// For production native apps, switch to SQLiteAdapter for better performance
const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
})

export const database = new Database({
  adapter,
  modelClasses: [Organization, Animal, HealthRecord, WeightRecord, BreedingRecord],
})

export { schema } from "./schema"
export * from "./models"
