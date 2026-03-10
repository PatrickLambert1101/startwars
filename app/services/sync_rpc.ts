/**
 * WatermelonDB <> Supabase Sync Engine (RPC Version)
 *
 * BEST PRACTICE IMPLEMENTATION using Supabase RPC functions
 * instead of direct table upserts. This avoids RLS policy issues.
 *
 * Based on official Supabase WatermelonDB guide:
 * https://supabase.com/blog/react-native-offline-first-watermelon-db
 */
import { synchronize, SyncPullArgs, SyncPushArgs } from "@nozbe/watermelondb/sync"
import { database } from "@/db"
import { supabase } from "@/services/supabase"

/**
 * Pull changes from Supabase using RPC function
 * This function runs as SECURITY DEFINER and bypasses RLS
 */
async function pullChanges({ lastPulledAt }: SyncPullArgs) {
  const lastPulledAtMs = lastPulledAt || 0

  console.log(`[Sync] Pulling changes since ${lastPulledAtMs}`)

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

  console.log(`[Sync] Pulled changes:`, {
    timestamp: data.timestamp,
    tables: Object.keys(data.changes || {}),
  })

  // Convert Supabase format to WatermelonDB format
  const changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {}

  for (const [tableName, tableChanges] of Object.entries(data.changes || {})) {
    const tc = tableChanges as any

    // Map Supabase table names to local table names
    const localTableName = tableName === "memberships" ? "organization_members" : tableName

    changes[localTableName] = {
      created: (tc.created || []).map(supabaseToWatermelon),
      updated: (tc.updated || []).map(supabaseToWatermelon),
      deleted: tc.deleted || [],
    }
  }

  return {
    changes,
    timestamp: data.timestamp,
  }
}

/**
 * Push local changes to Supabase using RPC function
 * This function runs as SECURITY DEFINER and bypasses RLS
 */
async function pushChanges({ changes }: SyncPushArgs) {
  console.log(`[Sync] Pushing changes:`, {
    tables: Object.keys(changes as any),
  })

  // Convert WatermelonDB format to Supabase format
  const supabaseChanges: Record<string, any> = {}

  for (const [localTableName, tableChanges] of Object.entries(changes as any)) {
    const { created, updated, deleted } = tableChanges as {
      created: any[]
      updated: any[]
      deleted: string[]
    }

    // Map local table names to Supabase table names
    const supabaseTableName =
      localTableName === "organization_members" ? "memberships" : localTableName

    supabaseChanges[supabaseTableName] = {
      created: created.map((r) => watermelonToSupabase(r)),
      updated: updated.map((r) => watermelonToSupabase(r)),
      deleted: deleted,
    }

    console.log(`[Sync] ${supabaseTableName}:`, {
      created: created.length,
      updated: updated.length,
      deleted: deleted.length,
    })
  }

  const { data, error } = await supabase.rpc("sync_push", {
    changes: supabaseChanges,
  })

  if (error) {
    console.error("[Sync] Push error:", error)
    throw new Error(`Sync push failed: ${error.message}`)
  }

  console.log(`[Sync] Push successful:`, data)
}

/**
 * Convert Supabase row → WatermelonDB-compatible record
 * (snake_case stays, but dates need to be timestamps)
 */
function supabaseToWatermelon(row: any) {
  const record: any = { ...row }
  // WatermelonDB expects dates as timestamps (ms)
  for (const key of Object.keys(record)) {
    if (key.endsWith("_at") || key.endsWith("_date")) {
      if (record[key] && typeof record[key] === "string") {
        record[key] = new Date(record[key]).getTime()
      }
    }
  }
  return record
}

/**
 * Convert WatermelonDB record → Supabase row
 * (timestamps → ISO strings for date columns)
 */
function watermelonToSupabase(record: any) {
  const row: any = { ...record }
  for (const key of Object.keys(row)) {
    if (key.endsWith("_at") || key.endsWith("_date")) {
      if (row[key] && typeof row[key] === "number") {
        row[key] = new Date(row[key]).toISOString()
      }
    }
  }
  return row
}

/**
 * Main sync function — call this from UI
 */
export async function syncDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Sync] Starting synchronization (RPC mode)...")

    await synchronize({
      database,
      pullChanges,
      pushChanges,
      migrationsEnabledAtVersion: 4,
    })

    console.log("[Sync] Synchronization complete!")
    return { success: true }
  } catch (error: any) {
    console.error("[Sync] Synchronization failed:", error)
    return { success: false, error: error?.message || "Sync failed" }
  }
}
