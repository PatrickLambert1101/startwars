#!/usr/bin/env tsx
/**
 * Delete excess test data to make sync faster
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

const DEMO_ORG_ID = '68b89705-d443-41f3-9923-ab010404e429'

async function main() {
  console.log('🗑️  Cleaning up excess test data...\n')

  // Delete all animals for demo org except first 100
  console.log('Step 1: Get animal IDs to keep...')
  const { data: keepAnimals } = await supabase
    .from('animals')
    .select('id')
    .eq('organization_id', DEMO_ORG_ID)
    .order('created_at', { ascending: true })
    .limit(100)

  const keepIds = keepAnimals?.map(a => a.id) || []
  console.log(`  Keeping ${keepIds.length} animals`)

  // Delete all animals NOT in keep list for this org
  console.log('\nStep 2: Delete excess animals...')
  const { data: allAnimals } = await supabase
    .from('animals')
    .select('id')
    .eq('organization_id', DEMO_ORG_ID)

  const deleteIds = allAnimals
    ?.filter(a => !keepIds.includes(a.id))
    .map(a => a.id) || []

  console.log(`  Found ${deleteIds.length} animals to delete`)

  if (deleteIds.length > 0) {
    // Delete in smaller batches
    const batchSize = 100
    for (let i = 0; i < deleteIds.length; i += batchSize) {
      const batch = deleteIds.slice(i, i + batchSize)
      console.log(`    Deleting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(deleteIds.length / batchSize)} (${batch.length} animals)`)

      // Delete related records first
      await supabase.from('health_records').delete().in('animal_id', batch)
      await supabase.from('weight_records').delete().in('animal_id', batch)
      await supabase.from('breeding_records').delete().in('animal_id', batch)
      await supabase.from('pasture_movements').delete().in('animal_id', batch)

      // Then delete animals
      await supabase.from('animals').delete().in('id', batch)
    }
  }

  // Final counts
  console.log('\n📊 Final record counts:')
  const tables = ['organizations', 'memberships', 'pastures', 'animals', 'health_records', 'weight_records', 'breeding_records']
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    console.log(`   ${table.padEnd(20)} ${count}`)
  }

  console.log('\n✅ Cleanup complete!')
}

main()
