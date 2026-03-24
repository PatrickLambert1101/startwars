#!/usr/bin/env tsx
/**
 * Check user memberships and organization data
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

async function main() {
  console.log('🔍 Checking user memberships and organizations...\n')

  // Check organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .eq('is_deleted', false)

  if (orgsError) {
    console.error('❌ Error fetching organizations:', orgsError)
    return
  }

  console.log(`📊 Organizations: ${orgs?.length || 0}`)
  orgs?.forEach(org => {
    console.log(`  - ${org.name} (${org.id})`)
  })

  // Check memberships
  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('*')
    .eq('is_deleted', false)

  if (membershipsError) {
    console.error('❌ Error fetching memberships:', membershipsError)
    return
  }

  console.log(`\n👥 Memberships: ${memberships?.length || 0}`)
  memberships?.forEach(m => {
    console.log(`  - User: ${m.user_email} → Org: ${m.organization_id} (${m.role})`)
  })

  // Check if lambertpatrick09+admina@gmail.com has memberships
  const targetEmail = 'lambertpatrick09+admina@gmail.com'
  const userMemberships = memberships?.filter(m => m.user_email === targetEmail)

  console.log(`\n🎯 Memberships for ${targetEmail}: ${userMemberships?.length || 0}`)

  if (userMemberships && userMemberships.length > 0) {
    const orgIds = userMemberships.map(m => m.organization_id)

    // Count data in user's organizations
    for (const orgId of orgIds) {
      const { count: animalCount } = await supabase
        .from('animals')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_deleted', false)

      const { count: pastureCount } = await supabase
        .from('pastures')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_deleted', false)

      console.log(`  Org ${orgId}:`)
      console.log(`    - Animals: ${animalCount}`)
      console.log(`    - Pastures: ${pastureCount}`)
    }
  } else {
    console.log('  ❌ NO MEMBERSHIPS FOUND!')
    console.log('\n💡 Need to create membership for this user')
  }
}

main()
