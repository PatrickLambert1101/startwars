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
  const orgId = '68b89705-d443-41f3-9923-ab010404e429'

  const { data, error } = await supabase
    .from('animals')
    .select('visual_tag, date_of_birth, sex, breed')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('Sample of 10 most recent animals:')
  console.log('='.repeat(80))
  data.forEach(a => {
    console.log(`Tag: ${a.visual_tag.padEnd(10)} | DOB: ${a.date_of_birth || 'NULL'} | Sex: ${a.sex.padEnd(10)} | Breed: ${a.breed}`)
  })
  console.log('='.repeat(80))

  // Count animals with and without DOB
  const { count: totalCount } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: withDob } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .not('date_of_birth', 'is', null)

  console.log(`\nTotal animals: ${totalCount}`)
  console.log(`Animals with DOB: ${withDob}`)
  console.log(`Animals without DOB: ${totalCount! - withDob!}`)
}

main()
