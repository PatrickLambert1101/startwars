#!/usr/bin/env tsx
/**
 * Count records in each table
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
  console.log('📊 Counting records in each table...\n')

  const tables = [
    'organizations',
    'memberships',
    'pastures',
    'animals',
    'health_records',
    'weight_records',
    'breeding_records'
  ]

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table}: Error - ${error.message}`)
    } else {
      console.log(`${table.padEnd(20)} ${count?.toLocaleString() || 0}`)
    }
  }
}

main()
