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
    .from('vaccination_schedules')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Error:', error.message)
  } else if (!data || data.length === 0) {
    console.log('No records in vaccination_schedules table')
    const { count } = await supabase
      .from('vaccination_schedules')
      .select('*', { count: 'exact', head: true })
    console.log(`Table exists with ${count} records`)
  } else {
    console.log('Columns in vaccination_schedules table:')
    Object.keys(data[0]).sort().forEach(col => console.log('  -', col))

    console.log('\nChecking for species-related columns:')
    Object.keys(data[0]).filter(k => k.toLowerCase().includes('spec')).forEach(col => {
      console.log('  Found:', col)
    })
  }
}

main()
