#!/usr/bin/env tsx
/**
 * Setup pastures, assign cattle, create vaccination schedules, and apply vaccines
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

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

// Pasture data
const PASTURE_NAMES = [
  'North Field', 'South Meadow', 'East Pasture', 'West Range',
  'River Bottom', 'Hill Top', 'Oak Grove', 'Pine Ridge',
  'Cedar Valley', 'Willow Creek', 'Sunset Field', 'Morning Glory',
  'Rocky Point', 'Green Valley', 'Spring Meadow'
]

const FORAGE_TYPES = ['native_grass', 'improved_grass', 'legume_mix', 'annual_grass']
const WATER_SOURCES = ['pond', 'creek', 'well', 'tank']
const FENCE_TYPES = ['barbed_wire', 'electric', 'pipe', 'combo']

// Vaccination data
const VACCINE_SCHEDULES = [
  {
    name: '7-Way Clostridial',
    description: 'Protection against 7 clostridial diseases',
    target_species: 'cattle',
    schedule_type: 'age_based',
    target_age_months: 2,
    age_window_days: 30,
    requires_booster: true,
    booster_interval_days: 21,
    booster_count: 1
  },
  {
    name: 'IBR-BVD-PI3-BRSV',
    description: 'Respiratory disease prevention',
    target_species: 'cattle',
    schedule_type: 'age_based',
    target_age_months: 3,
    age_window_days: 45,
    requires_booster: true,
    booster_interval_days: 28,
    booster_count: 1
  },
  {
    name: 'Annual Booster - 7-Way',
    description: 'Annual clostridial booster',
    target_species: 'cattle',
    schedule_type: 'group_based',
    interval_months: 12,
    requires_booster: false
  },
  {
    name: 'Brucellosis (Heifers)',
    description: 'Brucellosis vaccination for heifers',
    target_species: 'cattle',
    schedule_type: 'age_based',
    target_age_months: 6,
    age_window_days: 60,
    target_sex: 'female',
    min_age_months: 4,
    max_age_months: 12,
    requires_booster: false
  }
]

async function main() {
  console.log('🌾 Setting up pastures, assigning cattle, and creating vaccination program...\n')

  // ============================================================================
  // STEP 1: Create additional pastures
  // ============================================================================
  console.log('📍 Step 1: Creating pastures...')

  const { data: existingPastures } = await supabase
    .from('pastures')
    .select('id')
    .eq('organization_id', DEMO_ORG_ID)

  const existingCount = existingPastures?.length || 0
  console.log(`   Found ${existingCount} existing pastures`)

  const pasturesNeeded = Math.max(0, 15 - existingCount)

  if (pasturesNeeded > 0) {
    const newPastures = []
    for (let i = 0; i < pasturesNeeded; i++) {
      newPastures.push({
        id: randomUUID(),
        organization_id: DEMO_ORG_ID,
        name: PASTURE_NAMES[existingCount + i] || `Pasture ${existingCount + i + 1}`,
        code: `P${String(existingCount + i + 1).padStart(2, '0')}`,
        size_hectares: parseFloat(randomFloat(20, 200).toFixed(1)),
        forage_type: randomItem(FORAGE_TYPES),
        water_source: randomItem(WATER_SOURCES),
        fence_type: randomItem(FENCE_TYPES),
        has_salt_blocks: Math.random() > 0.3,
        has_mineral_feeders: Math.random() > 0.4,
        max_capacity: randomInt(40, 150),
        target_grazing_days: randomInt(14, 45),
        target_rest_days: randomInt(30, 90),
        current_animal_count: 0,
        is_active: true,
        is_deleted: false
      })
    }

    const { error } = await supabase.from('pastures').insert(newPastures)
    if (error) {
      console.error('❌ Error creating pastures:', error.message)
      process.exit(1)
    }

    console.log(`✅ Created ${pasturesNeeded} new pastures`)
  } else {
    console.log('✅ Already have 15 pastures')
  }

  // Get all pastures
  const { data: allPastures } = await supabase
    .from('pastures')
    .select('id, name, max_capacity')
    .eq('organization_id', DEMO_ORG_ID)
    .eq('is_deleted', false)
    .order('name')

  console.log(`📊 Total pastures: ${allPastures?.length}`)

  // ============================================================================
  // STEP 2: Assign cattle to pastures
  // ============================================================================
  console.log('\n🐄 Step 2: Assigning cattle to pastures...')

  const { data: allCattle } = await supabase
    .from('animals')
    .select('id, sex, status')
    .eq('organization_id', DEMO_ORG_ID)
    .eq('is_deleted', false)
    .eq('status', 'active')

  console.log(`   Found ${allCattle?.length} active cattle to assign`)

  if (allCattle && allPastures && allPastures.length > 0) {
    // Shuffle cattle and distribute across pastures
    const shuffled = [...allCattle].sort(() => Math.random() - 0.5)
    const updates: any[] = []
    const movements: any[] = []
    const now = new Date().toISOString()

    let currentPastureIdx = 0
    let currentPastureCount = 0

    for (const animal of shuffled) {
      const pasture = allPastures[currentPastureIdx]

      updates.push({
        id: animal.id,
        current_pasture_id: pasture.id
      })

      movements.push({
        id: randomUUID(),
        organization_id: DEMO_ORG_ID,
        animal_id: animal.id,
        pasture_id: pasture.id,
        movement_date: daysAgo(randomInt(1, 60)),
        movement_type: 'rotation',
        moved_by: 'System Setup',
        is_deleted: false
      })

      currentPastureCount++

      // Move to next pasture when approaching capacity
      if (currentPastureCount >= Math.floor(pasture.max_capacity * 0.8)) {
        currentPastureIdx = (currentPastureIdx + 1) % allPastures.length
        currentPastureCount = 0
      }
    }

    // Update animals in batches
    const BATCH_SIZE = 500
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE)
      for (const update of batch) {
        await supabase
          .from('animals')
          .update({ current_pasture_id: update.current_pasture_id })
          .eq('id', update.id)
      }
      console.log(`   Progress: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length} cattle assigned`)
    }

    // Insert movements in batches
    for (let i = 0; i < movements.length; i += BATCH_SIZE) {
      const batch = movements.slice(i, i + BATCH_SIZE)
      await supabase.from('pasture_movements').insert(batch)
    }

    console.log(`✅ Assigned ${updates.length} cattle to pastures`)
    console.log(`✅ Created ${movements.length} pasture movement records`)
  }

  // ============================================================================
  // STEP 3: Create treatment protocols for vaccines
  // ============================================================================
  console.log('\n💉 Step 3: Creating treatment protocols...')

  const protocols = [
    {
      id: randomUUID(),
      organization_id: DEMO_ORG_ID,
      name: 'Clostridial 7-Way',
      description: 'Seven-way clostridial vaccine',
      protocol_type: 'vaccination',
      product_name: 'Vision 7',
      dosage: '2 mL SC',
      administration_method: 'subcutaneous',
      withdrawal_days: 21,
      target_species: 'cattle',
      target_age_min: 60,
      target_age_max: null,
      is_active: true,
      is_deleted: false
    },
    {
      id: randomUUID(),
      organization_id: DEMO_ORG_ID,
      name: 'Respiratory Combo',
      description: 'IBR-BVD-PI3-BRSV combination vaccine',
      protocol_type: 'vaccination',
      product_name: 'Bovi-Shield Gold 5',
      dosage: '2 mL SC',
      administration_method: 'subcutaneous',
      withdrawal_days: 21,
      target_species: 'cattle',
      target_age_min: 90,
      target_age_max: null,
      is_active: true,
      is_deleted: false
    },
    {
      id: randomUUID(),
      organization_id: DEMO_ORG_ID,
      name: 'Brucellosis RB-51',
      description: 'Brucellosis vaccine for heifers',
      protocol_type: 'vaccination',
      product_name: 'RB-51',
      dosage: '2 mL SC',
      administration_method: 'subcutaneous',
      withdrawal_days: 0,
      target_species: 'cattle',
      target_age_min: 120,
      target_age_max: 365,
      is_active: true,
      is_deleted: false
    }
  ]

  const { error: protocolError } = await supabase
    .from('treatment_protocols')
    .insert(protocols)

  if (protocolError) {
    console.error('❌ Error creating protocols:', protocolError.message)
  } else {
    console.log(`✅ Created ${protocols.length} treatment protocols`)
  }

  // ============================================================================
  // STEP 4: Create vaccination schedules
  // ============================================================================
  console.log('\n📅 Step 4: Creating vaccination schedules...')

  const schedules = VACCINE_SCHEDULES.map((sched, i) => ({
    id: randomUUID(),
    organization_id: DEMO_ORG_ID,
    protocol_id: protocols[i % protocols.length].id,
    ...sched,
    is_active: true,
    is_deleted: false
  }))

  const { error: schedError } = await supabase
    .from('vaccination_schedules')
    .insert(schedules)

  if (schedError) {
    console.error('❌ Error creating schedules:', schedError.message)
  } else {
    console.log(`✅ Created ${schedules.length} vaccination schedules`)
  }

  // ============================================================================
  // STEP 5: Apply vaccines to cattle (create scheduled vaccinations)
  // ============================================================================
  console.log('\n💉 Step 5: Applying vaccines to cattle...')

  if (allCattle) {
    const scheduledVaccinations: any[] = []

    for (const animal of allCattle) {
      // Age-based vaccines - randomly apply to ~60% of cattle
      if (Math.random() > 0.4) {
        const schedule = randomItem(schedules.filter(s => s.schedule_type === 'age_based'))

        scheduledVaccinations.push({
          id: randomUUID(),
          organization_id: DEMO_ORG_ID,
          animal_id: animal.id,
          schedule_id: schedule.id,
          status: randomItem(['administered', 'administered', 'pending']),
          due_date: daysAgo(randomInt(0, 180)),
          administered_date: Math.random() > 0.3 ? daysAgo(randomInt(1, 180)) : null,
          dose_number: 1,
          is_deleted: false
        })

        // Add booster if required and initial was administered
        if (schedule.requires_booster && scheduledVaccinations[scheduledVaccinations.length - 1].administered_date) {
          scheduledVaccinations.push({
            id: randomUUID(),
            organization_id: DEMO_ORG_ID,
            animal_id: animal.id,
            schedule_id: schedule.id,
            status: randomItem(['administered', 'pending']),
            due_date: daysAgo(randomInt(0, 150)),
            administered_date: Math.random() > 0.5 ? daysAgo(randomInt(1, 150)) : null,
            dose_number: 2,
            parent_vaccination_id: scheduledVaccinations[scheduledVaccinations.length - 1].id,
            is_deleted: false
          })
        }
      }
    }

    // Insert in batches
    const BATCH_SIZE = 500
    let created = 0
    for (let i = 0; i < scheduledVaccinations.length; i += BATCH_SIZE) {
      const batch = scheduledVaccinations.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('scheduled_vaccinations').insert(batch)

      if (error) {
        console.error('❌ Error creating scheduled vaccinations:', error.message)
        break
      }

      created += batch.length
      console.log(`   Progress: ${created}/${scheduledVaccinations.length} vaccinations scheduled`)
    }

    console.log(`✅ Created ${created} scheduled vaccinations`)
  }

  // ============================================================================
  // STEP 6: Add vaccine records to health_records
  // ============================================================================
  console.log('\n📋 Step 6: Adding vaccine records to health records...')

  const { data: administeredVaccines } = await supabase
    .from('scheduled_vaccinations')
    .select('id, animal_id, schedule_id, administered_date, vaccination_schedules(protocol_id, treatment_protocols(name, product_name, dosage))')
    .eq('organization_id', DEMO_ORG_ID)
    .eq('status', 'administered')
    .not('administered_date', 'is', null)
    .limit(1000)

  if (administeredVaccines && administeredVaccines.length > 0) {
    const healthRecords = administeredVaccines.map((vacc: any) => {
      const protocol = vacc.vaccination_schedules?.treatment_protocols

      return {
        id: randomUUID(),
        organization_id: DEMO_ORG_ID,
        animal_id: vacc.animal_id,
        protocol_id: vacc.vaccination_schedules?.protocol_id,
        record_date: vacc.administered_date,
        record_type: 'vaccination',
        description: protocol?.name || 'Vaccine administered',
        product_name: protocol?.product_name,
        dosage: protocol?.dosage,
        administered_by: randomItem(['Dr. Smith', 'Dr. Jones', 'Tech Williams', 'Tech Brown']),
        is_deleted: false
      }
    })

    const BATCH_SIZE = 500
    let created = 0
    for (let i = 0; i < healthRecords.length; i += BATCH_SIZE) {
      const batch = healthRecords.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('health_records').insert(batch)

      if (error) {
        console.error('❌ Error creating health records:', error.message)
        break
      }

      created += batch.length
    }

    console.log(`✅ Created ${created} health records for administered vaccines`)
  }

  // Final summary
  console.log('\n' + '='.repeat(70))
  console.log('✅ PASTURE AND VACCINATION SETUP COMPLETE!')
  console.log('='.repeat(70))
  console.log('📊 Summary:')
  console.log(`   - ${allPastures?.length} pastures configured`)
  console.log(`   - ${allCattle?.length} cattle assigned to pastures`)
  console.log(`   - ${protocols.length} treatment protocols created`)
  console.log(`   - ${schedules.length} vaccination schedules created`)
  console.log(`   - Scheduled vaccinations and health records created`)
  console.log('='.repeat(70) + '\n')
}

main()
