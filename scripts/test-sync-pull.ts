#!/usr/bin/env tsx
/**
 * Test sync_pull RPC function
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
  console.log('🔍 Testing sync_pull RPC function...\n')

  const { data, error } = await supabase.rpc('sync_pull', { last_pulled_at: 0 })

  console.log('Data:', data)
  console.log('\nError:', error)

  if (error) {
    console.log('\n❌ Error details:', JSON.stringify(error, null, 2))
  } else if (!data) {
    console.log('\n⚠️  Data is null (no error, but no data returned)')
  } else {
    console.log('\n✅ Success! Tables returned:', Object.keys(data.changes || {}))
  }
}

main()
