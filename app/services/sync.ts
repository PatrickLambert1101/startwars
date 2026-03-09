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
import { database } from "@/db"
import { supabase } from "@/services/supabase"

const SYNC_TABLES = ["organizations", "animals", "health_records", "weight_records", "breeding_records", "treatment_protocols"] as const

type SyncTable = (typeof SYNC_TABLES)[number]

/**
 * Pull changes from Supabase since lastPulledAt
 */
async function pullChanges({ lastPulledAt }: SyncPullArgs) {
  const timestamp = Date.now()
  const changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {}

  for (const table of SYNC_TABLES) {
    const created: any[] = []
    const updated: any[] = []
    const deleted: string[] = []

    if (lastPulledAt) {
      // Fetch records updated after last sync
      const since = new Date(lastPulledAt).toISOString()

      const { data: upserted, error: upsertError } = await supabase
        .from(table)
        .select("*")
        .gt("updated_at", since)
        .eq("is_deleted", false)

      if (upsertError) {
        console.warn(`Sync pull error for ${table}:`, upsertError.message)
      }

      // Fetch deleted records
      const { data: deletedRows, error: deleteError } = await supabase
        .from(table)
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
        .from(table)
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
      const { error } = await supabase.from(table).upsert(rows)
      if (error) {
        console.error(`Sync push create error for ${table}:`, error.message)
        throw error
      }
    }

    // Upsert updated records
    if (updated.length > 0) {
      const rows = updated.map((r: any) => watermelonToSupabase(r, table))
      const { error } = await supabase.from(table).upsert(rows)
      if (error) {
        console.error(`Sync push update error for ${table}:`, error.message)
        throw error
      }
    }

    // Soft-delete deleted records
    if (deleted.length > 0) {
      const { error } = await supabase
        .from(table)
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
    return { success: true }
  } catch (error: any) {
    console.error("Sync failed:", error)
    return { success: false, error: error?.message || "Sync failed" }
  }
}
