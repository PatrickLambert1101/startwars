#!/usr/bin/env tsx
/**
 * Fix Future DOBs
 *
 * This script fixes animals that have future dates of birth (bug in original script)
 * and ensures all animals have realistic past DOBs
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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function randomPastDate(minDaysAgo: number, maxDaysAgo: number): string {
  return daysAgo(randomInt(minDaysAgo, maxDaysAgo))
}

async function fixFutureDOBs(userEmail: string) {
  console.log(`\n🔍 Finding organization for user: ${userEmail}...`)

  // Get user and organization
  const { data: authData } = await supabase.auth.admin.listUsers()
  const user = authData.users.find(u => u.email === userEmail)

  if (!user) {
    console.error(`❌ User ${userEmail} not found`)
    return
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) {
    console.error('❌ No organization found')
    return
  }

  const orgId = membership.organization_id
  console.log(`✅ Found organization: ${orgId}`)

  // Get all animals (we'll update all to ensure proper age distribution)
  console.log(`\n🐄 Fetching all animals...`)
  const { data: animals, error: fetchError } = await supabase
    .from('animals')
    .select('id, visual_tag, date_of_birth')
    .eq('organization_id', orgId)

  if (fetchError) {
    console.error('❌ Error fetching animals:', fetchError.message)
    return
  }

  console.log(`✅ Found ${animals.length} animals`)

  // Count future dates
  const now = new Date()
  const futureCount = animals.filter(a => new Date(a.date_of_birth) > now).length
  console.log(`   - ${futureCount} animals have future DOBs (need fixing)`)
  console.log(`   - ${animals.length - futureCount} animals have past DOBs (will update for consistency)`)

  console.log(`\n📅 Updating all animals with realistic DOBs (ages 6 months - 8 years)...`)

  const BATCH_SIZE = 100
  const batches = Math.ceil(animals.length / BATCH_SIZE)
  let totalUpdated = 0

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE
    const batchEnd = Math.min(batchStart + BATCH_SIZE, animals.length)
    const batchAnimals = animals.slice(batchStart, batchEnd)

    // Update each animal with a realistic past DOB
    for (const animal of batchAnimals) {
      // Age range: 180 days (6 months) to 2920 days (8 years)
      const dobDaysAgo = randomInt(180, 2920)
      const dateOfBirth = daysAgo(dobDaysAgo)

      const { error: updateError } = await supabase
        .from('animals')
        .update({ date_of_birth: dateOfBirth })
        .eq('id', animal.id)

      if (updateError) {
        console.error(`❌ Error updating animal ${animal.visual_tag}:`, updateError.message)
      } else {
        totalUpdated++
      }
    }

    console.log(`   Progress: ${totalUpdated}/${animals.length} animals updated (${Math.round(totalUpdated / animals.length * 100)}%)`)
  }

  console.log(`✅ Updated ${totalUpdated} animals with realistic DOBs`)
}

async function main() {
  const userEmail = process.argv[2] || 'lambertpatrick09+admina@gmail.com'

  console.log('🚀 Starting DOB Fix')
  console.log(`   User email: ${userEmail}`)
  console.log('')

  try {
    const startTime = Date.now()
    await fixFutureDOBs(userEmail)

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log('✅ FIX COMPLETE!')
    console.log('='.repeat(60))
    console.log(`⏱️  Time taken: ${duration} seconds`)
    console.log('\n💡 All animals now have realistic past DOBs!')
    console.log('   You can test vaccination scheduling now.')
    console.log('='.repeat(60) + '\n')

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
