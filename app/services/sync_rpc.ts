/**
 * WatermelonDB <> Supabase Sync Engine (RPC Version)
 *
 * Uses Supabase RPC functions (SECURITY DEFINER) to bypass RLS.
 * Based on: https://supabase.com/blog/react-native-offline-first-watermelon-db
 */
import { Model, Q } from "@nozbe/watermelondb"
import { synchronize, SyncPullArgs, SyncPushArgs } from "@nozbe/watermelondb/sync"

import { database, schema } from "@/db"
import { supabase } from "@/services/supabase"
import { reclassifyExistingCreatedRows, SyncChangeRow } from "@/services/syncChangeNormalization"
import { SyncRpcError, syncErrorMessage } from "@/utils/syncFailures"

// ---- Sync types ----------------------------------------------------------

type SyncRow = SyncChangeRow

interface SyncTableChanges {
  created: SyncRow[]
  updated: SyncRow[]
  deleted: string[]
}

type SyncChanges = Record<string, SyncTableChanges>

/** Extra date columns that don't match the `_at` / `_date` suffix pattern. */
const EXTRA_DATE_FIELDS = new Set<string>([
  "date_of_birth",
  "breeding_date",
  "expected_calving_date",
  "actual_calving_date",
  "movement_date",
  "treatment_date",
  "measurement_date",
  "record_date",
  "activity_date",
])

/**
 * Columns stored as strings in WatermelonDB but as JSONB in Postgres.
 * These must be parsed to objects before being sent in push payloads.
 */
const JSONB_FIELDS = new Set<string>(["livestock_types", "default_breeds"])

/**
 * JSONB columns whose values arrive from sync_pull as JS objects/arrays
 * but must be stored as JSON strings in WatermelonDB (@field, not @json).
 * Without this, WatermelonDB's sanitizedRaw would call String() on them
 * producing "[object Object]" / "tag1,tag2" corrupted values.
 */
const JSONB_STRINGIFY_FIELDS = new Set<string>(["tags", "genetic_traits", "default_breeds"])

// Keep below SQLite's usual bind-variable limit when checking a large initial pull.
const EXISTING_ID_QUERY_BATCH_SIZE = 500

function isDateField(key: string): boolean {
  return key.endsWith("_at") || key.endsWith("_date") || EXTRA_DATE_FIELDS.has(key)
}

/**
 * Move server "created" rows that already exist locally into "updated".
 *
 * The sync RPC uses timestamps to classify creates. That means a device can
 * receive its own just-pushed row as created on the next pull. We must retain
 * true creates for new/empty devices, while preventing create-existing
 * diagnostics for echoed rows. Locally deleted IDs count as existing so their
 * pending deletion continues to win.
 */
async function normalizePulledChanges(
  localTableName: string,
  created: SyncRow[],
  updated: SyncRow[],
) {
  const createdIds = created.flatMap((row) => (typeof row.id === "string" ? [row.id] : []))
  if (createdIds.length === 0) {
    return { created, updated, reclassifiedCount: 0 }
  }

  const collection = database.get<Model>(localTableName)
  const existingIds = new Set<string>(await database.adapter.getDeletedRecords(collection.table))

  for (let index = 0; index < createdIds.length; index += EXISTING_ID_QUERY_BATCH_SIZE) {
    const idBatch = createdIds.slice(index, index + EXISTING_ID_QUERY_BATCH_SIZE)
    const foundIds = await collection.query(Q.where("id", Q.oneOf(idBatch))).fetchIds()
    foundIds.forEach((id) => existingIds.add(id))
  }

  return reclassifyExistingCreatedRows(created, updated, existingIds)
}

/**
 * Pull changes from Supabase via RPC (SECURITY DEFINER — bypasses RLS).
 */
async function pullChanges({ lastPulledAt }: SyncPullArgs) {
  const lastPulledAtMs = lastPulledAt || 0

  if (__DEV__) console.log(`[Sync] Pulling changes since ${lastPulledAtMs}`)

  const { data, error } = await supabase.rpc("sync_pull", {
    last_pulled_at: lastPulledAtMs,
    // Lets the server withhold tables this build's schema doesn't know about
    // (e.g. report_templates for pre-v18 installs).
    client_schema_version: schema.version,
  })

  if (error) {
    throw new SyncRpcError("pull", error)
  }

  // Only a valid server checkpoint can advance WatermelonDB's pull cursor.
  // Inventing a device timestamp for an empty response could skip real records.
  if (
    !data ||
    !data.changes ||
    typeof data.changes !== "object" ||
    Array.isArray(data.changes) ||
    !Number.isSafeInteger(data.timestamp) ||
    data.timestamp <= 0 ||
    data.timestamp < lastPulledAtMs
  ) {
    throw new Error("Sync pull returned an invalid response; checkpoint was not advanced")
  }

  if (__DEV__) {
    console.log(`[Sync] Pulled changes:`, {
      timestamp: data.timestamp,
      tables: Object.keys(data.changes || {}),
    })
  }

  const changes: SyncChanges = {}
  const rawChanges = (data.changes || {}) as Record<string, Partial<SyncTableChanges>>

  for (const [tableName, tableChanges] of Object.entries(rawChanges)) {
    // Map Supabase table names to local table names
    const localTableName = tableName === "memberships" ? "organization_members" : tableName

    // Drop tables this build's schema doesn't know — WatermelonDB throws on
    // unknown tables, which would brick sync when the server is ahead of us.
    if (!(localTableName in schema.tables)) {
      if (__DEV__) console.log(`[Sync] Skipping unknown table from server: ${tableName}`)
      continue
    }

    const rawCreated = (tableChanges.created ?? []).map(supabaseToWatermelon)
    const rawUpdated = (tableChanges.updated ?? []).map(supabaseToWatermelon)
    const deleted = tableChanges.deleted ?? []
    const { created, updated, reclassifiedCount } = await normalizePulledChanges(
      localTableName,
      rawCreated,
      rawUpdated,
    )

    if (__DEV__) {
      console.log(
        `[Sync] ${tableName}: ${created.length} created, ${updated.length} updated, ${deleted.length} deleted`,
      )
      if (reclassifiedCount > 0) {
        console.log(
          `[Sync] ${tableName}: reclassified ${reclassifiedCount} existing creates as updates`,
        )
      }
    }

    changes[localTableName] = { created, updated, deleted }
  }

  return { changes, timestamp: data.timestamp }
}

/**
 * Push local changes to Supabase via RPC (SECURITY DEFINER — bypasses RLS).
 */
async function pushChanges({ changes }: SyncPushArgs) {
  const tableKeys = Object.keys(changes)
  if (tableKeys.length === 0) return

  if (__DEV__) console.log(`[Sync] Pushing changes from ${tableKeys.length} tables`)

  const supabaseChanges: SyncChanges = {}

  const localChanges = changes as unknown as Record<
    string,
    {
      created: Model[]
      updated: Model[]
      deleted: string[]
    }
  >

  for (const [localTableName, tableChanges] of Object.entries(localChanges)) {
    const { created, updated, deleted } = tableChanges
    const totalChanges = created.length + updated.length + deleted.length
    if (totalChanges === 0) continue

    // Map local table names to Supabase table names
    const supabaseTableName =
      localTableName === "organization_members" ? "memberships" : localTableName

    supabaseChanges[supabaseTableName] = {
      created: created.map(watermelonToSupabase),
      updated: updated.map(watermelonToSupabase),
      deleted,
    }

    if (__DEV__) {
      console.log(
        `[Sync] → ${supabaseTableName}: +${created.length} ~${updated.length} -${deleted.length}`,
      )
    }
  }

  const { data: pushResult, error } = await supabase.rpc("sync_push", {
    changes: supabaseChanges,
  })

  if (error) {
    throw new SyncRpcError("push", error)
  }

  // A missing acknowledgement must leave local records pending for retry.
  if (!pushResult || pushResult.success !== true || pushResult.error_count > 0) {
    throw new Error("Sync push was not acknowledged; local changes remain pending")
  }
}

/**
 * Convert Supabase row → WatermelonDB-compatible record.
 * ISO date strings become millisecond timestamps.
 * Server-side fields not in the local schema are stripped.
 */
function supabaseToWatermelon(row: SyncRow): SyncRow {
  const record: SyncRow = { ...row }

  // Strip fields that don't exist in the local WatermelonDB schema
  delete record._status
  delete record._changed
  delete record.remote_id

  for (const key of Object.keys(record)) {
    if (isDateField(key)) {
      const value = record[key]
      if (typeof value === "string" && value.length > 0) {
        record[key] = new Date(value).getTime()
      }
    } else if (JSONB_STRINGIFY_FIELDS.has(key)) {
      const value = record[key]
      if (value !== null && value !== undefined && typeof value !== "string") {
        record[key] = JSON.stringify(value)
      }
    }
  }

  return record
}

type ModelWithRaw = Model & { _raw: SyncRow }

/**
 * Convert WatermelonDB record → Supabase row.
 * Timestamps become ISO strings; JSONB fields are parsed from their string form.
 */
function watermelonToSupabase(record: Model | SyncRow): SyncRow {
  const raw = (record as ModelWithRaw)._raw ?? (record as SyncRow)
  const row: SyncRow = { ...raw }

  for (const key of Object.keys(row)) {
    if (isDateField(key)) {
      const value = row[key]
      if (typeof value === "number") {
        row[key] = new Date(value).toISOString()
      }
    }
  }

  // WatermelonDB stores JSONB columns as strings; Postgres expects actual objects.
  for (const field of JSONB_FIELDS) {
    const value = row[field]
    if (typeof value === "string" && value.length > 0) {
      try {
        row[field] = JSON.parse(value)
      } catch {
        console.warn(`[Sync] Failed to parse ${field} as JSON:`, value)
      }
    }
  }

  delete row._status
  delete row._changed

  return row
}

/**
 * Main sync function — call this from UI.
 */
export interface SyncResult {
  success: boolean
  error?: string
  cause?: unknown
}

async function runDatabaseSync(): Promise<SyncResult> {
  try {
    if (__DEV__) console.log("[Sync] Starting synchronization...")

    await synchronize({
      database,
      pullChanges,
      pushChanges,
      migrationsEnabledAtVersion: 3,
    })

    if (__DEV__) console.log("[Sync] Synchronization complete!")

    return { success: true }
  } catch (error: unknown) {
    // The sync hook owns reporting, retry policy and user-facing status.
    return { success: false, error: syncErrorMessage(error), cause: error }
  }
}

// All callers share the same WatermelonDB operation, including refresh gestures.
let syncInFlight: Promise<SyncResult> | null = null
export function syncDatabase(): Promise<SyncResult> {
  if (syncInFlight) return syncInFlight
  const operation = runDatabaseSync()
  syncInFlight = operation
  const release = () => {
    if (syncInFlight === operation) syncInFlight = null
  }
  void operation.then(release, release)
  return operation
}
