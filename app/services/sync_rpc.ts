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
  console.log("[Sync] pushChanges called")
  console.log("[Sync] Raw changes object:", JSON.stringify(changes, null, 2))

  const tableKeys = Object.keys(changes as any)

  if (tableKeys.length === 0) {
    console.log(`[Sync] No local changes to push - changes object is empty`)
    return
  }

  console.log(`[Sync] Pushing changes from ${tableKeys.length} tables:`, tableKeys)

  // Convert WatermelonDB format to Supabase format
  const supabaseChanges: Record<string, any> = {}

  for (const [localTableName, tableChanges] of Object.entries(changes as any)) {
    const { created, updated, deleted } = tableChanges as {
      created: any[]
      updated: any[]
      deleted: string[]
    }

    const totalChanges = created.length + updated.length + deleted.length

    // Skip tables with no changes
    if (totalChanges === 0) {
      continue
    }

    // Map local table names to Supabase table names
    const supabaseTableName =
      localTableName === "organization_members" ? "memberships" : localTableName

    supabaseChanges[supabaseTableName] = {
      created: created.map((r) => watermelonToSupabase(r)),
      updated: updated.map((r) => watermelonToSupabase(r)),
      deleted: deleted,
    }

    console.log(`[Sync] → ${supabaseTableName}: ${totalChanges} changes`, {
      created: created.length,
      updated: updated.length,
      deleted: deleted.length,
    })

    // Log first created record for debugging
    if (created.length > 0) {
      console.log(`[Sync]   First created record:`, {
        id: created[0].id,
        _status: created[0]._status,
        _changed: created[0]._changed,
      })
    }
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

  // Remove reserved WatermelonDB fields that might come from Supabase
  delete record._status
  delete record._changed

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
  // Use _raw to get the actual data (spreading doesn't work on WatermelonDB models)
  const raw = record._raw || record
  const row: any = { ...raw }

  // Convert timestamp fields (milliseconds) to ISO strings for Postgres
  for (const key of Object.keys(row)) {
    if (key.endsWith("_at") || key.endsWith("_date")) {
      if (row[key] && typeof row[key] === "number") {
        row[key] = new Date(row[key]).toISOString()
      }
    }
  }

  // Convert JSONB string fields to actual JSON objects
  // WatermelonDB stores JSONB as strings, but Postgres jsonb_populate_record
  // expects actual JSON objects for JSONB columns
  const jsonbFields = ['livestock_types', 'default_breeds']
  for (const field of jsonbFields) {
    if (row[field] && typeof row[field] === 'string') {
      try {
        row[field] = JSON.parse(row[field])
      } catch (e) {
        console.warn(`[Sync] Failed to parse ${field} as JSON:`, row[field])
      }
    }
  }

  return row
}

/**
 * Fix organizations with invalid subscription_tier values
 * Supabase has CHECK constraint requiring: 'starter', 'farm', or 'commercial'
 * Old orgs may have empty strings which fail the constraint
 */
async function fixOrganizationSubscriptionTiers() {
  try {
    const allOrgs = await database.get<any>("organizations").query().fetch()

    let fixed = 0

    await database.write(async () => {
      for (const org of allOrgs) {
        const tier = org._raw.subscription_tier

        // Check if subscription_tier is invalid
        if (!tier || tier === "" || tier === "null" || !["starter", "farm", "commercial"].includes(tier)) {
          console.log(`[Sync] Fixing org ${org._raw.name}: setting subscription_tier to 'starter'`)

          await org.update((o: any) => {
            o.subscriptionTier = "starter"
            if (!o.subscriptionStatus || o.subscriptionStatus === "null") {
              o.subscriptionStatus = "active"
            }
          })

          fixed++
        }
      }
    })

    if (fixed > 0) {
      console.log(`[Sync] Fixed subscription_tier for ${fixed} organizations`)
      return true // Signal that we made changes
    }

    return false
  } catch (error) {
    console.error("[Sync] Failed to fix organization subscription tiers:", error)
    return false
  }
}

/**
 * Fix organizations that have null remote_id by setting it to their id
 * This is needed because local orgs are created without remote_id,
 * and after syncing to Supabase, the server uses the org's id as the reference
 */
async function fixOrganizationRemoteIds() {
  try {
    const { Q } = await import("@nozbe/watermelondb")
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

/**
 * Ensure organizations have at least one admin member
 * This fixes cases where orgs were created without membership records,
 * or where memberships exist locally but haven't been pushed to Supabase
 * Returns true if any changes were made that need to be synced
 */
async function ensureOrganizationMemberships(userId?: string, userEmail?: string, userDisplayName?: string | null): Promise<boolean> {
  try {
    if (!userId || !userEmail) {
      console.log("[Sync] Cannot fix memberships: user info not provided")
      return false
    }

    const { Q } = await import("@nozbe/watermelondb")

    console.log("[Sync] Ensuring memberships for user:", userEmail)

    let madeChanges = false

    // Get all active organizations
    const allOrgs = await database.get<any>("organizations")
      .query(Q.where("is_deleted", false))
      .fetch()

    console.log(`[Sync] Found ${allOrgs.length} organizations to check`)

    for (const org of allOrgs) {
      // Check if membership exists in Supabase (not just locally)
      const { data: supabaseMembership, error: membershipError } = await supabase
        .from("memberships")
        .select("*")
        .eq("organization_id", org.remoteId || org.id)
        .eq("user_id", userId)
        .single()

      if (membershipError && membershipError.code !== "PGRST116") {
        console.error(`[Sync] Error checking membership for ${org.name}:`, membershipError)
        continue
      }

      if (!supabaseMembership) {
        console.log(`[Sync] No membership in Supabase for ${org.name}, checking local...`)

        // Check if user has a local membership
        const existingMemberships = await database.get<any>("organization_members")
          .query(
            Q.where("organization_id", org.id),
            Q.where("user_id", userId)
          )
          .fetch()

        if (existingMemberships.length > 0) {
          // Mark existing membership as updated to trigger push
          console.log(`[Sync] Marking existing membership as updated for ${org.name}`)
          await database.write(async () => {
            await existingMemberships[0].update((m: any) => {
              // Update fields to ensure they're set correctly and marked as changed
              m.userEmail = userEmail
              m.userDisplayName = userDisplayName || m.userDisplayName
              m.updatedAt = new Date()
            })
          })
          madeChanges = true
        } else {
          // No membership at all - create one
          console.log(`[Sync] Creating new admin membership for ${userEmail} in ${org.name}`)
          await database.write(async () => {
            await database.get<any>("organization_members").create((m: any) => {
              m.organizationId = org.id
              m.userId = userId
              m.userEmail = userEmail
              m.userDisplayName = userDisplayName
              m.role = "admin"
              m.invitedBy = null
              m.invitedAt = null
              m.joinedAt = new Date()
              m.isActive = true
              m.isDeleted = false
            })
          })
          console.log(`[Sync] Admin membership created successfully`)
          madeChanges = true
        }
      } else {
        console.log(`[Sync] Membership already exists in Supabase for ${org.name}`)
      }
    }

    return madeChanges
  } catch (error) {
    console.error("[Sync] Failed to ensure organization memberships:", error)
    // Don't throw - this is a non-critical fix
    return false
  }
}

/**
 * Main sync function — call this from UI
 */
export async function syncDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Sync] Starting synchronization (RPC mode)...")

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    await synchronize({
      database,
      pullChanges,
      pushChanges,
      migrationsEnabledAtVersion: 13, // Updated to match current schema version
    })

    console.log("[Sync] Synchronization complete!")

    // Fix any organizations with invalid subscription_tier values
    const tierChanges = await fixOrganizationSubscriptionTiers()

    // After sync, ensure organizations have their remote_id set
    await fixOrganizationRemoteIds()

    // Ensure user has admin membership in their organizations
    console.log("[Sync] Checking memberships for user:", user?.email)
    let membershipChanges = false
    if (user) {
      membershipChanges = await ensureOrganizationMemberships(
        user.id,
        user.email,
        user.user_metadata?.display_name || user.user_metadata?.full_name || null
      )
    } else {
      console.log("[Sync] No user found, skipping membership check")
    }

    // If we made changes to memberships or tiers, run sync again to push them
    if (membershipChanges || tierChanges) {
      console.log("[Sync] Local changes detected, running second sync to push them...")
      await synchronize({
        database,
        pullChanges,
        pushChanges,
        migrationsEnabledAtVersion: 13,
      })
      console.log("[Sync] Second sync complete!")
    }

    console.log("[Sync] Post-sync fixes complete")

    return { success: true }
  } catch (error: any) {
    console.error("[Sync] Synchronization failed:", error)
    return { success: false, error: error?.message || "Sync failed" }
  }
}
