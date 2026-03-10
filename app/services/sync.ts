/**
 * WatermelonDB <> Supabase Sync Engine
 *
 * Uses WatermelonDB's built-in sync protocol. The sync pulls changes from
 * Supabase since the last sync timestamp, and pushes local changes.
 *
 * Each table maps to a Supabase table with the same name. WatermelonDB
 * tracks changes automatically and provides them in the push payload.
 */
import { synchronize, SyncPullArgs, SyncPushArgs } from "@nozbe/watermelondb/sync"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { supabase } from "@/services/supabase"

const SYNC_TABLES = ["organizations", "organization_members", "animals", "health_records", "weight_records", "breeding_records", "treatment_protocols"] as const

type SyncTable = (typeof SYNC_TABLES)[number]

// Map local table names to Supabase table names
const TABLE_MAP: Record<string, string> = {
  organization_members: "memberships", // Local: organization_members, Supabase: memberships
}

// Get Supabase table name from local table name
function getSupabaseTable(localTable: string): string {
  return TABLE_MAP[localTable] || localTable
}

/**
 * Pull changes from Supabase since lastPulledAt
 */
async function pullChanges({ lastPulledAt }: SyncPullArgs) {
  const timestamp = Date.now()
  const changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {}

  for (const table of SYNC_TABLES) {
    const supabaseTable = getSupabaseTable(table)
    const created: any[] = []
    const updated: any[] = []
    const deleted: string[] = []

    if (lastPulledAt) {
      // Fetch records updated after last sync
      const since = new Date(lastPulledAt).toISOString()

      const { data: upserted, error: upsertError} = await supabase
        .from(supabaseTable)
        .select("*")
        .gt("updated_at", since)
        .eq("is_deleted", false)

      if (upsertError) {
        console.warn(`Sync pull error for ${table}:`, upsertError.message)
      }

      // Fetch deleted records
      const { data: deletedRows, error: deleteError } = await supabase
        .from(supabaseTable)
        .select("id")
        .gt("updated_at", since)
        .eq("is_deleted", true)

      if (deleteError) {
        console.warn(`Sync pull deleted error for ${table}:`, deleteError.message)
      }

      if (upserted) {
        // Determine if created or updated based on created_at
        for (const row of upserted) {
          const record = supabaseToWatermelon(row)
          if (new Date(row.created_at).getTime() > lastPulledAt) {
            created.push(record)
          } else {
            updated.push(record)
          }
        }
      }

      if (deletedRows) {
        deleted.push(...deletedRows.map((r: any) => r.id))
      }
    } else {
      // First sync — pull everything
      const { data, error } = await supabase
        .from(supabaseTable)
        .select("*")
        .eq("is_deleted", false)

      if (error) {
        console.warn(`Sync initial pull error for ${table}:`, error.message)
      }

      if (data) {
        created.push(...data.map(supabaseToWatermelon))
      }
    }

    changes[table] = { created, updated, deleted }
  }

  return { changes, timestamp }
}

/**
 * Push local changes to Supabase
 */
async function pushChanges({ changes }: SyncPushArgs) {
  for (const table of SYNC_TABLES) {
    const supabaseTable = getSupabaseTable(table)
    const tableChanges = (changes as any)[table]
    if (!tableChanges) continue

    const { created, updated, deleted } = tableChanges as {
      created: any[]
      updated: any[]
      deleted: string[]
    }

    // Upsert created records
    if (created.length > 0) {
      const rows = created.map((r: any) => watermelonToSupabase(r, table))
      const { error } = await supabase.from(supabaseTable).upsert(rows, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      if (error) {
        console.error(`Sync push create error for ${table}:`, error.message)
        throw error
      }
    }

    // Upsert updated records
    if (updated.length > 0) {
      const rows = updated.map((r: any) => watermelonToSupabase(r, table))
      const { error } = await supabase.from(supabaseTable).upsert(rows)
      if (error) {
        console.error(`Sync push update error for ${table}:`, error.message)
        throw error
      }
    }

    // Soft-delete deleted records
    if (deleted.length > 0) {
      const { error } = await supabase
        .from(supabaseTable)
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .in("id", deleted)

      if (error) {
        console.error(`Sync push delete error for ${table}:`, error.message)
        throw error
      }
    }
  }
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
function watermelonToSupabase(record: any, _table: SyncTable) {
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
    await synchronize({
      database,
      pullChanges,
      pushChanges,
      migrationsEnabledAtVersion: 4, // Updated to match current schema version
    })

    // After sync, ensure organizations have their remote_id set
    await fixOrganizationRemoteIds()

    return { success: true }
  } catch (error: any) {
    console.error("Sync failed:", error)
    return { success: false, error: error?.message || "Sync failed" }
  }
}

/**
 * Fix organizations that have null remote_id by setting it to their id
 * This is needed because local orgs are created without remote_id,
 * and after syncing to Supabase, the server uses the org's id as the reference
 */
async function fixOrganizationRemoteIds() {
  try {
    const { Organization } = database.collections
    const orgsWithoutRemoteId = await database.get<any>("organizations")
      .query(Q.where("remote_id", null), Q.where("is_deleted", false))
      .fetch()

    if (orgsWithoutRemoteId.length > 0) {
      console.log(`[Sync] Fixing ${orgsWithoutRemoteId.length} organizations without remote_id`)

      await database.write(async () => {
        for (const org of orgsWithoutRemoteId) {
          await org.update((o: any) => {
            o.remoteId = org.id
          })
        }
      })

      console.log("[Sync] Organization remote_ids fixed successfully")
    }
  } catch (error) {
    console.error("[Sync] Failed to fix organization remote_ids:", error)
    // Don't throw - this is a non-critical fix
  }
}
