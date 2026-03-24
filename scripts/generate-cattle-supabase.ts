#!/usr/bin/env tsx
/**
 * Generate Cattle Data - Supabase Version
 *
 * This script generates cattle data directly in Supabase (bypassing WatermelonDB).
 * Use this for large datasets like 6000+ cattle.
 *
 * Usage:
 *   npx tsx scripts/generate-cattle-supabase.ts <organization_id> [count]
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
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  }
})

// ─── Data Constants ─────────────────────────────────────────────────────────

const BREEDS = [
  'Nguni', 'Brahman', 'Bonsmara', 'Afrikaner', 'Simmentaler',
  'Hereford', 'Angus', 'Charolais', 'Limousin', 'Drakensberger'
]

const PASTURE_DATA = [
  { name: 'North Pasture', code: 'NP-01', forageType: 'Kikuyu', waterSource: 'Borehole', fenceType: 'Electric' },
  { name: 'South Pasture', code: 'SP-01', forageType: 'Eragrostis', waterSource: 'Dam', fenceType: 'Barbed wire' },
  { name: 'East Paddock', code: 'EP-01', forageType: 'Buffel grass', waterSource: 'River', fenceType: 'Electric' },
  { name: 'West Pasture', code: 'WP-01', forageType: 'Smuts finger', waterSource: 'Borehole', fenceType: 'Electric' },
  { name: 'Breeding Camp', code: 'BC-01', forageType: 'Kikuyu', waterSource: 'Trough', fenceType: 'Game fence' },
  { name: 'Weaning Camp', code: 'WC-01', forageType: 'Rye grass', waterSource: 'Trough', fenceType: 'Barbed wire' },
]

const HEALTH_RECORDS_DATA = [
  { type: 'vaccination', description: 'FMD Vaccination', product: 'Aftovax', dosage: '2ml subcutaneous', withdrawalDays: 0 },
  { type: 'vaccination', description: 'Multivax Annual', product: 'Multivax P Plus', dosage: '5ml subcutaneous', withdrawalDays: 21 },
  { type: 'vaccination', description: 'LSD Vaccination', product: 'Herbivac LS', dosage: '1ml subcutaneous', withdrawalDays: 0 },
  { type: 'treatment', description: 'Deworming treatment', product: 'Dectomax', dosage: '1ml per 10kg', withdrawalDays: 35 },
  { type: 'treatment', description: 'Tick treatment', product: 'Triatix', dosage: 'Spray application', withdrawalDays: 14 },
  { type: 'vet_visit', description: 'Routine health check', product: null, dosage: null, withdrawalDays: 0 },
]

const ADMINISTERED_BY = ['Dr. van der Merwe', 'Farmer', 'Farmhand', 'Dr. Nkosi', 'Dr. Pretorius']

const BULL_NAMES = ['Thor', 'Titan', 'Goliath', 'Duke', 'Rex', 'Atlas', 'Samson', 'Brutus', 'Diesel', 'Chief']
const COW_NAMES = ['Daisy', 'Bella', 'Rosie', 'Molly', 'Nala', 'Luna', 'Stella', 'Grace', 'Amber', 'Pearl']

// ─── Helper Functions ───────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function randomPastDate(minDaysAgo: number, maxDaysAgo: number): string {
  return daysAgo(randomInt(minDaysAgo, maxDaysAgo))
}

// ─── Main Generation Functions ──────────────────────────────────────────────

async function createPastures(organizationId: string) {
  console.log('\n🌾 Creating pastures...')

  const pastures = PASTURE_DATA.map(p => ({
    id: randomUUID(),
    organization_id: organizationId,
    name: p.name,
    code: p.code,
    size_hectares: randomFloat(10, 150),
    forage_type: p.forageType,
    water_source: p.waterSource,
    fence_type: p.fenceType,
    has_salt_blocks: Math.random() > 0.4,
    has_mineral_feeders: Math.random() > 0.5,
    max_capacity: randomInt(20, 80),
    target_grazing_days: randomInt(14, 45),
    target_rest_days: randomInt(30, 90),
    current_animal_count: 0,
    is_active: true,
    is_deleted: false
  }))

  const { data, error } = await supabase
    .from('pastures')
    .insert(pastures)
    .select('id')

  if (error) throw error

  console.log(`✅ Created ${data.length} pastures`)
  return data.map(p => p.id)
}

async function createAnimals(organizationId: string, pastureIds: string[], count: number) {
  console.log(`\n🐄 Creating ${count} cattle (this may take a while)...`)

  const BATCH_SIZE = 100
  const batches = Math.ceil(count / BATCH_SIZE)
  let totalCreated = 0
  const animalIds: string[] = []
  const bullIds: string[] = []
  const cowIds: string[] = []

  let bullNameIdx = 0
  let cowNameIdx = 0

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE
    const batchEnd = Math.min(batchStart + BATCH_SIZE, count)
    const batchCount = batchEnd - batchStart

    const animals = []

    for (let i = 0; i < batchCount; i++) {
      const globalIdx = batchStart + i

      // Weighted sex selection: 15% bulls, 60% cows, 25% steers
      const r = Math.random()
      let sex: 'male' | 'female' | 'castrated'
      if (r < 0.15) {
        sex = 'male'
      } else if (r < 0.75) {
        sex = 'female'
      } else {
        sex = 'castrated'
      }

      const visualTag = `${randomItem(['A', 'B', 'C', 'T', 'W'])}${String(globalIdx + 1).padStart(4, '0')}`
      const rfidTag = `ZA${Date.now().toString().slice(-6)}${String(globalIdx).padStart(5, '0')}`
      const dobDaysAgo = randomInt(365, 365 * 8)
      const hasPasture = pastureIds.length > 0 && Math.random() > 0.2
      const currentPastureId = hasPasture ? randomItem(pastureIds) : null
      const status = Math.random() > 0.05 ? 'active' : randomItem(['sold', 'transferred'])

      // Assign names to some animals
      let name: string | null = null
      if (sex === 'male' && Math.random() > 0.7 && bullNameIdx < BULL_NAMES.length) {
        name = BULL_NAMES[bullNameIdx++]
      } else if (sex === 'female' && Math.random() > 0.85 && cowNameIdx < COW_NAMES.length) {
        name = COW_NAMES[cowNameIdx++]
      }

      animals.push({
        id: randomUUID(),
        organization_id: organizationId,
        species: 'cattle',
        rfid_tag: rfidTag,
        visual_tag: visualTag,
        name: name,
        breed: randomItem(BREEDS),
        sex: sex,
        date_of_birth: randomPastDate(dobDaysAgo, dobDaysAgo + 30),
        current_pasture_id: currentPastureId,
        status: status,
        herd_tag: randomItem(['A', 'B', 'C', null, null]),
        is_deleted: false
      })
    }

    const { data, error } = await supabase
      .from('animals')
      .insert(animals)
      .select('id, sex')

    if (error) {
      console.error(`❌ Error in batch ${batch + 1}:`, error.message)
      throw error
    }

    totalCreated += data.length
    data.forEach(animal => {
      animalIds.push(animal.id)
      if (animal.sex === 'male') bullIds.push(animal.id)
      if (animal.sex === 'female') cowIds.push(animal.id)
    })

    console.log(`   Progress: ${totalCreated}/${count} cattle created (${Math.round(totalCreated / count * 100)}%)`)
  }

  console.log(`✅ Created ${totalCreated} cattle`)
  return { animalIds, bullIds, cowIds }
}

async function createHealthRecords(organizationId: string, animalIds: string[]) {
  console.log('\n💉 Creating health records...')

  const BATCH_SIZE = 500
  const allRecords: any[] = []

  // 1-3 records per animal
  for (const animalId of animalIds) {
    const count = randomInt(1, 3)
    for (let i = 0; i < count; i++) {
      const template = randomItem(HEALTH_RECORDS_DATA)
      const recordDate = randomPastDate(30, 365)
      const withdrawalDate = template.withdrawalDays > 0
        ? new Date(new Date(recordDate).getTime() + template.withdrawalDays * 86400000).toISOString()
        : null

      allRecords.push({
        id: randomUUID(),
        organization_id: organizationId,
        animal_id: animalId,
        record_date: recordDate,
        record_type: template.type,
        description: template.description,
        product_name: template.product,
        dosage: template.dosage,
        administered_by: randomItem(ADMINISTERED_BY),
        withdrawal_date: withdrawalDate,
        is_deleted: false
      })
    }
  }

  // Insert in batches
  let totalCreated = 0
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('health_records').insert(batch)
    if (error) throw error
    totalCreated += batch.length
    console.log(`   Progress: ${totalCreated}/${allRecords.length} health records`)
  }

  console.log(`✅ Created ${totalCreated} health records`)
}

async function createWeightRecords(organizationId: string, animalIds: string[]) {
  console.log('\n⚖️  Creating weight records...')

  const BATCH_SIZE = 500
  const allRecords: any[] = []

  // Create weight records with a sample of animals (sampling to reduce total count)
  const sampledAnimalIds = animalIds.filter(() => Math.random() < 0.7) // 70% of animals

  for (const animalId of sampledAnimalIds) {
    const count = randomInt(2, 5)
    const baseWeight = randomFloat(280, 650)

    for (let i = count; i >= 1; i--) {
      const daysBack = i * randomInt(45, 90)
      const growthFactor = 1 - i * randomFloat(0.02, 0.05)
      const weight = parseFloat((baseWeight * Math.max(0.5, growthFactor)).toFixed(1))

      allRecords.push({
        id: randomUUID(),
        organization_id: organizationId,
        animal_id: animalId,
        record_date: daysAgo(daysBack),
        weight_kg: weight,
        condition_score: randomInt(2, 5), // Changed from randomFloat to randomInt (1-9 scale)
        is_deleted: false
      })
    }
  }

  // Insert in batches
  let totalCreated = 0
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('weight_records').insert(batch)
    if (error) throw error
    totalCreated += batch.length
    console.log(`   Progress: ${totalCreated}/${allRecords.length} weight records`)
  }

  console.log(`✅ Created ${totalCreated} weight records`)
}

async function createBreedingRecords(organizationId: string, bullIds: string[], cowIds: string[]) {
  if (cowIds.length === 0) {
    console.log('\n⚠️  No cows available, skipping breeding records')
    return
  }

  console.log('\n🐮 Creating breeding records...')

  // 60% of cows get breeding records
  const eligibleCows = cowIds.slice(0, Math.ceil(cowIds.length * 0.6))
  const methods = ['natural', 'natural', 'natural', 'ai']
  const outcomes = ['live_calf', 'live_calf', 'live_calf', 'pending', 'open', 'aborted']

  const records = eligibleCows.map(cowId => {
    const breedingDate = randomPastDate(90, 400)
    const method = randomItem(methods)
    const outcome = randomItem(outcomes)
    const expectedCalvingDate = new Date(new Date(breedingDate).getTime() + 283 * 86400000).toISOString()
    const actualCalvingDate = outcome === 'live_calf'
      ? new Date(new Date(expectedCalvingDate).getTime() + randomInt(-14, 14) * 86400000).toISOString()
      : null

    return {
      id: randomUUID(),
      organization_id: organizationId,
      animal_id: cowId,
      bull_id: bullIds.length > 0 ? randomItem(bullIds) : null,
      breeding_date: breedingDate,
      method: method,
      expected_calving_date: expectedCalvingDate,
      actual_calving_date: actualCalvingDate,
      outcome: outcome,
      is_deleted: false
    }
  })

  const { error } = await supabase.from('breeding_records').insert(records)
  if (error) throw error

  console.log(`✅ Created ${records.length} breeding records`)
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const organizationId = process.argv[2]
  const count = parseInt(process.argv[3] || '6000')

  if (!organizationId) {
    console.error('❌ Please provide an organization ID')
    console.log('Usage: npx tsx scripts/generate-cattle-supabase.ts <organization_id> [count]')
    process.exit(1)
  }

  console.log('🚀 Starting Cattle Data Generation')
  console.log(`   Organization ID: ${organizationId}`)
  console.log(`   Cattle count: ${count}`)
  console.log('')

  try {
    const startTime = Date.now()

    // Step 1: Create pastures
    const pastureIds = await createPastures(organizationId)

    // Step 2: Create animals
    const { animalIds, bullIds, cowIds } = await createAnimals(organizationId, pastureIds, count)

    // Step 3: Create health records
    await createHealthRecords(organizationId, animalIds)

    // Step 4: Create weight records
    await createWeightRecords(organizationId, animalIds)

    // Step 5: Create breeding records
    await createBreedingRecords(organizationId, bullIds, cowIds)

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log('✅ DATA GENERATION COMPLETE!')
    console.log('='.repeat(60))
    console.log(`📊 Summary:`)
    console.log(`   - ${pastureIds.length} pastures`)
    console.log(`   - ${animalIds.length} cattle (${bullIds.length} bulls, ${cowIds.length} cows)`)
    console.log(`   - Health, weight, and breeding records created`)
    console.log(`   - Time taken: ${duration} minutes`)
    console.log('='.repeat(60) + '\n')

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
