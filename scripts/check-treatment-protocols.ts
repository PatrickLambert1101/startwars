#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data, error } = await supabase
    .from('treatment_protocols')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Error:', error.message)
  } else if (!data || data.length === 0) {
    console.log('No records in treatment_protocols table')
    console.log('Checking if table exists...')

    const { count } = await supabase
      .from('treatment_protocols')
      .select('*', { count: 'exact', head: true })

    console.log(`Table exists with ${count} records`)
  } else {
    console.log('Columns in treatment_protocols table:')
    Object.keys(data[0]).sort().forEach(col => console.log('  -', col))
  }
}

main()
