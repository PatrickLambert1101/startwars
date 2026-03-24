#!/usr/bin/env tsx
/**
 * Add parent-child relationships to existing cattle
 * Creates calves for breeding records and links them to parents
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { randomUUID } from 'crypto'

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

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log('🔗 Adding parent-child relationships...\n')

  // Step 1: Get all breeding records with live calves that don't have calf_id set
  const { data: breedingRecords, error: breedingError } = await supabase
    .from('breeding_records')
    .select('id, animal_id, bull_id, actual_calving_date, organization_id')
    .eq('organization_id', DEMO_ORG_ID)
    .eq('outcome', 'live_calf')
    .is('calf_id', null)

  if (breedingError) {
    console.error('❌ Error fetching breeding records:', breedingError.message)
    process.exit(1)
  }

  console.log(`📋 Found ${breedingRecords.length} breeding records needing calves`)

  if (breedingRecords.length === 0) {
    console.log('✅ No work needed!')
    return
  }

  // Step 2: Get pasture IDs
  const { data: pastures } = await supabase
    .from('pastures')
    .select('id')
    .eq('organization_id', DEMO_ORG_ID)

  const pastureIds = pastures?.map(p => p.id) || []

  // Step 3: Create calves
  console.log('\n🐄 Creating calves...')
  const calves = breedingRecords.map((record, index) => {
    const calvingDate = new Date(record.actual_calving_date!)
    const sex = Math.random() > 0.5 ? 'female' : 'male'
    const visualTag = `C${String(index + 1).padStart(4, '0')}`
    const rfidTag = `ZA${Date.now().toString().slice(-6)}${String(index).padStart(5, '0')}`

    return {
      id: randomUUID(),
      organization_id: DEMO_ORG_ID,
      species: 'cattle',
      visual_tag: visualTag,
      rfid_tag: rfidTag,
      name: null,
      breed: 'Angus', // You could fetch parent breed
      sex: sex,
      date_of_birth: calvingDate.toISOString(),
      dam_id: record.animal_id, // Mother (cow)
      sire_id: record.bull_id,  // Father (bull)
      current_pasture_id: pastureIds.length > 0 ? randomItem(pastureIds) : null,
      status: 'active',
      is_deleted: false
    }
  })

  // Insert calves in batches
  const BATCH_SIZE = 500
  const createdCalves: any[] = []

  for (let i = 0; i < calves.length; i += BATCH_SIZE) {
    const batch = calves.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase
      .from('animals')
      .insert(batch)
      .select('id')

    if (error) {
      console.error('❌ Error creating calves:', error.message)
      process.exit(1)
    }

    createdCalves.push(...(data || []))
    console.log(`   Progress: ${createdCalves.length}/${calves.length} calves created`)
  }

  console.log(`✅ Created ${createdCalves.length} calves`)

  // Step 4: Update breeding records with calf_id
  console.log('\n🔗 Linking breeding records to calves...')

  for (let i = 0; i < breedingRecords.length; i++) {
    const record = breedingRecords[i]
    const calf = createdCalves[i]

    const { error } = await supabase
      .from('breeding_records')
      .update({ calf_id: calf.id })
      .eq('id', record.id)

    if (error) {
      console.error(`❌ Error updating breeding record ${i + 1}:`, error.message)
    }

    if ((i + 1) % 100 === 0) {
      console.log(`   Progress: ${i + 1}/${breedingRecords.length} records updated`)
    }
  }

  console.log(`✅ Updated ${breedingRecords.length} breeding records`)

  // Step 5: Add weight records for calves
  console.log('\n⚖️  Creating weight records for calves...')

  const weightRecords: any[] = []
  createdCalves.forEach((calf, index) => {
    const breedingRecord = breedingRecords[index]
    const birthDate = new Date(breedingRecord.actual_calving_date!)
    const now = new Date()
    const ageInDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))

    // Create 2-4 weight records for each calf
    const recordCount = Math.min(randomInt(2, 4), Math.floor(ageInDays / 60)) // Max 1 per 60 days

    for (let i = 0; i < recordCount; i++) {
      const daysOld = Math.floor((i + 1) * (ageInDays / (recordCount + 1)))
      const recordDate = new Date(birthDate.getTime() + daysOld * 24 * 60 * 60 * 1000)

      // Calves grow from ~30kg at birth to ~200kg+ depending on age
      const birthWeight = 30
      const growthRate = 0.8 // kg per day
      const weight = parseFloat((birthWeight + daysOld * growthRate).toFixed(1))

      weightRecords.push({
        id: randomUUID(),
        organization_id: DEMO_ORG_ID,
        animal_id: calf.id,
        record_date: recordDate.toISOString(),
        weight_kg: weight,
        condition_score: randomInt(3, 5),
        is_deleted: false
      })
    }
  })

  // Insert weight records in batches
  let weightCreated = 0
  for (let i = 0; i < weightRecords.length; i += BATCH_SIZE) {
    const batch = weightRecords.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('weight_records').insert(batch)

    if (error) {
      console.error('❌ Error creating weight records:', error.message)
      break
    }

    weightCreated += batch.length
    console.log(`   Progress: ${weightCreated}/${weightRecords.length} weight records`)
  }

  console.log(`✅ Created ${weightCreated} weight records for calves`)

  // Final summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ PARENT-CHILD RELATIONSHIPS COMPLETE!')
  console.log('='.repeat(60))
  console.log(`📊 Summary:`)
  console.log(`   - ${createdCalves.length} calves created`)
  console.log(`   - ${breedingRecords.length} breeding records linked`)
  console.log(`   - ${weightCreated} weight records added`)
  console.log('='.repeat(60) + '\n')
}

main()
