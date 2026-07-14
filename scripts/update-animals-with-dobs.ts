#!/usr/bin/env tsx
/**
 * Update Animals with Date of Birth
 *
 * This script updates all animals for a specific user's organization with random DOBs
 * so they can test vaccination scheduling.
 *
 * Usage:
 *   npx tsx scripts/update-animals-with-dobs.ts <user_email>
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

async function getOrganizationForUser(userEmail: string): Promise<string | null> {
  console.log(`\n🔍 Finding organization for user: ${userEmail}...`)

  // First, get the user ID from auth
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching users:', authError.message)
    return null
  }

  const user = authData.users.find(u => u.email === userEmail)

  if (!user) {
    console.error(`❌ User ${userEmail} not found`)
    return null
  }

  console.log(`✅ Found user: ${user.id}`)

  // Get the organization from memberships
  const { data: membership, error: memberError } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (memberError) {
    console.error('❌ Error fetching membership:', memberError.message)
    return null
  }

  console.log(`✅ Found organization: ${membership.organization_id}`)
  return membership.organization_id
}

async function updateAnimalsWithDOBs(organizationId: string) {
  console.log(`\n🐄 Fetching animals without DOBs...`)

  // Get all animals without date_of_birth
  const { data: animals, error: fetchError } = await supabase
    .from('animals')
    .select('id, visual_tag, sex')
    .eq('organization_id', organizationId)
    .is('date_of_birth', null)

  if (fetchError) {
    console.error('❌ Error fetching animals:', fetchError.message)
    throw fetchError
  }

  console.log(`✅ Found ${animals.length} animals without DOBs`)

  if (animals.length === 0) {
    console.log('✅ All animals already have DOBs!')
    return
  }

  console.log(`\n📅 Updating animals with random DOBs (ages 1-8 years)...`)

  const BATCH_SIZE = 100
  const batches = Math.ceil(animals.length / BATCH_SIZE)
  let totalUpdated = 0

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE
    const batchEnd = Math.min(batchStart + BATCH_SIZE, animals.length)
    const batchAnimals = animals.slice(batchStart, batchEnd)

    // Update each animal in the batch with a random DOB
    for (const animal of batchAnimals) {
      // Generate a random age between 1 and 8 years (365 to 2920 days ago)
      const dobDaysAgo = randomInt(365, 365 * 8)
      const dateOfBirth = randomPastDate(dobDaysAgo, dobDaysAgo + 30)

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

  console.log(`✅ Updated ${totalUpdated} animals with DOBs`)
}

async function main() {
  const userEmail = process.argv[2]

  if (!userEmail) {
    console.error('❌ Please provide a user email')
    console.log('Usage: npx tsx scripts/update-animals-with-dobs.ts <user_email>')
    process.exit(1)
  }

  console.log('🚀 Starting Animal DOB Update')
  console.log(`   User email: ${userEmail}`)
  console.log('')

  try {
    const startTime = Date.now()

    // Step 1: Get organization for user
    const organizationId = await getOrganizationForUser(userEmail)

    if (!organizationId) {
      console.error('❌ Could not find organization for user')
      process.exit(1)
    }

    // Step 2: Update animals with DOBs
    await updateAnimalsWithDOBs(organizationId)

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log('✅ UPDATE COMPLETE!')
    console.log('='.repeat(60))
    console.log(`⏱️  Time taken: ${duration} seconds`)
    console.log('\n💡 You can now test vaccination scheduling!')
    console.log('='.repeat(60) + '\n')

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
