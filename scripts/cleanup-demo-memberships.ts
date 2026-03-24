#!/usr/bin/env tsx
/**
 * Cleanup Demo User Memberships
 *
 * Removes incorrect memberships that were created by the buggy sync logic.
 * Keeps only the membership to "Demo Ranch" for the demo admin user.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DEMO_ADMIN_EMAIL = 'lambertpatrick09+admina@gmail.com'
const DEMO_ORG_ID = '68b89705-d443-41f3-9923-ab010404e429' // The one with 6000 cattle

async function main() {
  console.log('🧹 Cleaning up demo user memberships...\n')

  // Verify the Demo Ranch organization exists
  const { data: demoOrg, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', DEMO_ORG_ID)
    .single()

  if (orgError || !demoOrg) {
    console.error('❌ Could not find Demo Ranch organization:', DEMO_ORG_ID)
    process.exit(1)
  }

  console.log(`✅ Found Demo Ranch: ${demoOrg.name} (${demoOrg.id})`)

  // Get all memberships for the demo admin user
  const { data: memberships, error: memberError } = await supabase
    .from('memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_email', DEMO_ADMIN_EMAIL)

  if (memberError) {
    console.error('❌ Error fetching memberships:', memberError.message)
    process.exit(1)
  }

  console.log(`\n📋 Found ${memberships.length} memberships for ${DEMO_ADMIN_EMAIL}:`)
  memberships.forEach((m: any) => {
    const orgName = m.organizations?.name || 'Unknown'
    const isDemo = m.organization_id === demoOrg.id ? '✅ KEEP' : '❌ DELETE'
    console.log(`   ${isDemo} - ${orgName}`)
  })

  // Delete memberships that are NOT for the correct Demo Ranch
  const toDelete = memberships.filter(m => m.organization_id !== DEMO_ORG_ID)

  if (toDelete.length === 0) {
    console.log('\n✅ No cleanup needed - user only has Demo Ranch membership')
    return
  }

  console.log(`\n🗑️  Deleting ${toDelete.length} incorrect memberships...`)

  const idsToDelete = toDelete.map(m => m.id)
  const { error: deleteError } = await supabase
    .from('memberships')
    .delete()
    .in('id', idsToDelete)

  if (deleteError) {
    console.error('❌ Error deleting memberships:', deleteError.message)
    process.exit(1)
  }

  console.log(`✅ Deleted ${toDelete.length} incorrect memberships`)
  console.log('\n✅ Cleanup complete! User now only has access to Demo Ranch')
}

main()
