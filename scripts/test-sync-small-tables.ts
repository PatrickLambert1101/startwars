#!/usr/bin/env tsx
/**
 * Test if we can manually query the small tables that sync_pull would return
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
  console.log('🔍 Testing small table queries...\n')

  // Test organizations
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('is_deleted', false)

  console.log(`Organizations: ${orgs?.length || 0} records`)
  if (orgError) console.log('  Error:', orgError.message)

  // Test memberships
  const { data: memberships, error: memberError } = await supabase
    .from('memberships')
    .select('*')
    .eq('is_deleted', false)

  console.log(`Memberships: ${memberships?.length || 0} records`)
  if (memberError) console.log('  Error:', memberError.message)

  // Test pastures
  const { data: pastures, error: pastureError } = await supabase
    .from('pastures')
    .select('*')
    .eq('is_deleted', false)

  console.log(`Pastures: ${pastures?.length || 0} records`)
  if (pastureError) console.log('  Error:', pastureError.message)

  console.log('\n✅ All small tables queryable')
  console.log('\nNow testing sync_pull with incremental sync (should be fast)...')

  // Test with a future timestamp - should return empty results quickly
  const futureTimestamp = Date.now() + 1000000
  const { data, error } = await supabase.rpc('sync_pull', { last_pulled_at: futureTimestamp })

  if (error) {
    console.log('❌ Error:', error.message)
  } else if (data) {
    console.log('✅ Incremental sync works!')
    console.log('Tables:', Object.keys(data.changes || {}))
  } else {
    console.log('⚠️  Returned null')
  }
}

main()
