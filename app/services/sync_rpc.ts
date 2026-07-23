/**
 * WatermelonDB <> Supabase Sync Engine (RPC Version)
 *
 * Uses Supabase RPC functions (SECURITY DEFINER) to bypass RLS.
 * Based on: https://supabase.com/blog/react-native-offline-first-watermelon-db
 */
import { synchronize, SyncPullArgs, SyncPushArgs } from "@nozbe/watermelondb/sync"
import { Model } from "@nozbe/watermelondb"
import { database } from "@/db"
import { supabase } from "@/services/supabase"

// ---- Sync types ----------------------------------------------------------

type SyncRow = Record<string, unknown>

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

function isDateField(key: string): boolean {
  return key.endsWith("_at") || key.endsWith("_date") || EXTRA_DATE_FIELDS.has(key)
}

/**
 * Pull changes from Supabase via RPC (SECURITY DEFINER — bypasses RLS).
 */
async function pullChanges({ lastPulledAt }: SyncPullArgs) {
  const lastPulledAtMs = lastPulledAt || 0

  if (__DEV__) console.log(`[Sync] Pulling changes since ${lastPulledAtMs}`)

  const { data, error } = await supabase.rpc("sync_pull", {
    last_pulled_at: lastPulledAtMs,
  })

  if (error) {
    console.error("[Sync] Pull error:", error)
    throw new Error(`Sync pull failed: ${error.message}`)
  }

  if (!data) {
    console.warn("[Sync] No data returned from sync_pull")
    return { changes: {}, timestamp: Date.now() }
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

    const created = (tableChanges.created ?? []).map(supabaseToWatermelon)
    const updated = (tableChanges.updated ?? []).map(supabaseToWatermelon)
    const deleted = tableChanges.deleted ?? []

    if (__DEV__) {
      console.log(`[Sync] ${tableName}: ${created.length} created, ${updated.length} updated, ${deleted.length} deleted`)
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

  const localChanges = changes as unknown as Record<string, {
    created: Model[]
    updated: Model[]
    deleted: string[]
  }>

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
      console.log(`[Sync] → ${supabaseTableName}: +${created.length} ~${updated.length} -${deleted.length}`)
    }
  }

  const { data: pushResult, error } = await supabase.rpc("sync_push", { changes: supabaseChanges })

  if (error) {
    console.error("[Sync] Push error:", error)
    throw new Error(`Sync push failed: ${error.message}`)
  }

  if (pushResult && !pushResult.success) {
    console.error("[Sync] Push returned errors:", pushResult.errors)
    throw new Error(`Sync push failed with ${pushResult.error_count} error(s)`)
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
export async function syncDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    if (__DEV__) console.log("[Sync] Starting synchronization...")

    await synchronize({
      database,
      pullChanges,
      pushChanges,
      migrationsEnabledAtVersion: 3,
      // Our sync_pull classifies rows as "created" purely by created_at >
      // last_pulled_at, so a device gets its OWN just-pushed rows back as
      // "created" on the next pull (pull happens before the watermark covers
      // the push). Without this flag WatermelonDB treats that as a fatal
      // "record already exists locally" diagnostic and recovers awkwardly,
      // which delayed newly-added records from appearing. This flag makes the
      // create-of-existing case a normal update instead.
      sendCreatedAsUpdated: true,
    })

    if (__DEV__) console.log("[Sync] Synchronization complete!")

    return { success: true }
  } catch (error: any) {
    console.error("[Sync] Synchronization failed:", error)
    return { success: false, error: error?.message || "Sync failed" }
  }
}
