/**
 * Fix organizations with empty subscription_tier
 * Run this once to fix local data before syncing
 */
import { database } from "./app/db"

async function fixSubscriptionTiers() {
  console.log("Fixing subscription tiers...")

  const orgs = await database.get("organizations").query().fetch()

  console.log(`Found ${orgs.length} organizations`)

  let fixed = 0

  await database.write(async () => {
    for (const org of orgs) {
      const orgData = org._raw as any

      // Check if subscription_tier is empty or invalid
      if (!orgData.subscription_tier || orgData.subscription_tier === "" || orgData.subscription_tier === "null") {
        console.log(`Fixing org: ${orgData.name} - setting subscription_tier to 'starter'`)

        await org.update((o: any) => {
          o.subscriptionTier = "starter"
          o.subscriptionStatus = "active"
        })

        fixed++
      }
    }
  })

  console.log(`✅ Fixed ${fixed} organizations`)
  console.log("Now run a sync to push the corrected data to Supabase")
}

fixSubscriptionTiers().catch(console.error)
