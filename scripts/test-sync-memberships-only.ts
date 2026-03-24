#!/usr/bin/env tsx
/**
 * Test if sync_pull returns memberships specifically
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
  console.log('🔍 Testing sync_pull for memberships...\n')

  // Use a timestamp from 1 hour ago to get very recent data (avoid timeout)
  const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000)

  const { data, error } = await supabase.rpc('sync_pull', { last_pulled_at: oneHourAgo })

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (!data || !data.changes) {
    console.log('⚠️  No data returned')
    return
  }

  const memberships = data.changes.memberships || {}
  const created = memberships.created || []
  const updated = memberships.updated || []
  const deleted = memberships.deleted || []

  console.log(`✅ Memberships returned:`)
  console.log(`   Created: ${created.length}`)
  console.log(`   Updated: ${updated.length}`)
  console.log(`   Deleted: ${deleted.length}`)

  if (created.length > 0) {
    console.log(`\n📋 Sample membership:`)
    console.log(JSON.stringify(created[0], null, 2))
  }

  // Also check other tables
  console.log(`\n📊 All tables:`)
  for (const [table, changes] of Object.entries(data.changes)) {
    const c = changes as any
    console.log(`   ${table}: created=${c.created?.length || 0}, updated=${c.updated?.length || 0}, deleted=${c.deleted?.length || 0}`)
  }
}

main()
