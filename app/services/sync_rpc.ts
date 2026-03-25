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
  const tableKeys = Object.keys(changes as any)

  if (tableKeys.length === 0) {
    return
  }

  console.log(`[Sync] Pushing changes from ${tableKeys.length} tables`)

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

    if (totalChanges > 0) {
      console.log(`[Sync] → ${supabaseTableName}: +${created.length} ~${updated.length} -${deleted.length}`)
    }
  }

  const { data, error } = await supabase.rpc("sync_push", {
    changes: supabaseChanges,
  })

  if (error) {
    console.error("[Sync] Push error:", error)
    throw new Error(`Sync push failed: ${error.message}`)
  }
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
  const dateFields = ["date_of_birth", "breeding_date", "expected_calving_date", "actual_calving_date", "movement_date", "treatment_date", "measurement_date", "record_date"]
  for (const key of Object.keys(row)) {
    if (key.endsWith("_at") || key.endsWith("_date") || dateFields.includes(key)) {
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

  // Remove WatermelonDB internal fields before sending to Supabase
  delete row._status
  delete row._changed

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
      return true // Signal that we made changes
    }
    return false
  } catch (error) {
    console.error("[Sync] Failed to fix organization remote_ids:", error)
    // Don't throw - this is a non-critical fix
    return false
  }
}

/**
 * Check which organizations exist locally but not in Supabase, and mark them for sync
 * This fixes the case where orgs were created but never successfully pushed
 */
async function ensureMissingOrganizationsArePushed(): Promise<boolean> {
  try {
    const { Q } = await import("@nozbe/watermelondb")

    // Get all local organizations
    const localOrgs = await database.get<any>("organizations")
      .query(Q.where("is_deleted", false))
      .fetch()

    if (localOrgs.length === 0) {
      return false
    }

    console.log(`[Sync] Checking ${localOrgs.length} local organizations against Supabase`)

    // Get all organization IDs from Supabase
    const orgIds = localOrgs.map(org => org.id)
    const { data: supabaseOrgs, error } = await supabase
      .from("organizations")
      .select("id")
      .in("id", orgIds)

    if (error) {
      console.error("[Sync] Failed to check organizations in Supabase:", error)
      return false
    }

    const supabaseOrgIds = new Set(supabaseOrgs?.map(o => o.id) || [])
    const missingOrgs = localOrgs.filter(org => !supabaseOrgIds.has(org.id))

    if (missingOrgs.length > 0) {
      console.log(`[Sync] Found ${missingOrgs.length} organizations missing from Supabase:`, missingOrgs.map(o => o.name))

      await database.write(async () => {
        for (const org of missingOrgs) {
          // Marking as updated will trigger a push
          await org.update((o: any) => {
            // Just touch the record to mark it as needing sync
            o.remoteId = org.id || org.remoteId
          })
        }
      })

      console.log("[Sync] Marked missing organizations for sync")
      return true
    }

    console.log("[Sync] All local organizations exist in Supabase")
    return false
  } catch (error) {
    console.error("[Sync] Failed to check missing organizations:", error)
    return false
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

    // Get only organizations where this user already has a local membership
    // We should NOT automatically create memberships for all orgs in the database
    const userMemberships = await database.get<any>("organization_members")
      .query(
        Q.where("user_id", userId),
        Q.where("is_deleted", false)
      )
      .fetch()

    if (userMemberships.length === 0) {
      console.log(`[Sync] No memberships to sync for user`)
      return false
    }

    // Get the organizations for these memberships
    const orgIds = userMemberships.map(m => m.organizationId)
    const allOrgs = await database.get<any>("organizations")
      .query(
        Q.where("id", Q.oneOf(orgIds)),
        Q.where("is_deleted", false)
      )
      .fetch()

    if (allOrgs.length === 0) {
      console.log(`[Sync] No organizations to check`)
      return false
    }

    let checkedCount = 0
    let createdCount = 0
    let updatedCount = 0

    for (const org of allOrgs) {
      // First, check if we have a local membership
      const existingMemberships = await database.get<any>("organization_members")
        .query(
          Q.where("organization_id", org.id),
          Q.where("user_id", userId)
        )
        .fetch()

      if (existingMemberships.length === 0) {
        // No membership at all - this is unusual, but create one
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
        createdCount++
        madeChanges = true
        checkedCount++
        continue
      }

      const localMembership = existingMemberships[0]

      // If remote_id is already set, the membership was successfully synced - skip expensive Supabase check
      if (localMembership.remoteId) {
        // Already synced, just verify data is up to date
        const needsUpdate =
          localMembership.userEmail !== userEmail ||
          (userDisplayName && localMembership.userDisplayName !== userDisplayName)

        if (needsUpdate) {
          await database.write(async () => {
            await localMembership.update((m: any) => {
              m.userEmail = userEmail
              if (userDisplayName) m.userDisplayName = userDisplayName
            })
          })
          updatedCount++
          madeChanges = true
        }
        checkedCount++
        continue
      }

      // No remote_id - this means it hasn't been pushed yet or the push failed
      // Check if it exists in Supabase to be safe
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
        // Not in Supabase and no remote_id - needs to be pushed
        // Update data if needed and set remote_id to trigger sync
        const needsUpdate =
          localMembership.userEmail !== userEmail ||
          (userDisplayName && localMembership.userDisplayName !== userDisplayName)

        await database.write(async () => {
          await localMembership.update((m: any) => {
            if (needsUpdate) {
              m.userEmail = userEmail
              if (userDisplayName) m.userDisplayName = userDisplayName
            }
            // Set remote_id to prevent re-checking on every sync
            m.remoteId = localMembership.id
          })
        })
        updatedCount++
        madeChanges = true
      } else {
        // Exists in Supabase - just set remote_id locally to mark as synced
        await database.write(async () => {
          await localMembership.update((m: any) => {
            m.remoteId = localMembership.id
          })
        })
        updatedCount++
        madeChanges = true
      }

      checkedCount++
    }

    if (createdCount > 0 || updatedCount > 0) {
      console.log(`[Sync] Memberships: checked ${checkedCount}, created ${createdCount}, updated ${updatedCount}`)
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
    const remoteIdChanges = await fixOrganizationRemoteIds()

    // Check which organizations are missing from Supabase and mark them for sync
    const missingOrgChanges = await ensureMissingOrganizationsArePushed()

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

    // If we made changes to memberships, tiers, or found missing orgs, run sync again to push them
    if (membershipChanges || tierChanges || remoteIdChanges || missingOrgChanges) {
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
