#!/usr/bin/env tsx
/**
 * Fix ALL Animal DOBs with Pagination
 *
 * This script fixes ALL animals with proper pagination to handle 7000+ animals
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

async function fixAllDOBs(orgId: string) {
  console.log(`\n📊 Getting total count of animals...`)

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  if (countError) {
    console.error('❌ Error counting animals:', countError.message)
    return
  }

  console.log(`✅ Total animals: ${totalCount}`)

  // Fetch all animals in batches
  const PAGE_SIZE = 1000
  let offset = 0
  let totalUpdated = 0

  console.log(`\n📅 Updating all animals with realistic DOBs (ages 6 months - 8 years)...`)

  while (offset < totalCount!) {
    console.log(`\n   Fetching batch: ${offset} to ${offset + PAGE_SIZE}...`)

    const { data: animals, error: fetchError } = await supabase
      .from('animals')
      .select('id, visual_tag')
      .eq('organization_id', orgId)
      .range(offset, offset + PAGE_SIZE - 1)

    if (fetchError) {
      console.error('❌ Error fetching animals:', fetchError.message)
      break
    }

    console.log(`   Updating ${animals.length} animals...`)

    // Update animals one by one (more reliable for large datasets)
    for (let i = 0; i < animals.length; i++) {
      const animal = animals[i]

      // Age range: 180 days (6 months) to 2920 days (8 years)
      const dobDaysAgo = randomInt(180, 2920)
      const dateOfBirth = daysAgo(dobDaysAgo)

      const { error: updateError } = await supabase
        .from('animals')
        .update({ date_of_birth: dateOfBirth })
        .eq('id', animal.id)

      if (updateError) {
        console.error(`❌ Error updating ${animal.visual_tag}:`, updateError.message)
      } else {
        totalUpdated++

        // Log progress every 50 animals
        if (totalUpdated % 50 === 0) {
          console.log(`      Progress: ${totalUpdated}/${totalCount} (${Math.round(totalUpdated / totalCount! * 100)}%)`)
        }
      }
    }

    offset += PAGE_SIZE
  }

  console.log(`\n✅ Updated ${totalUpdated} animals with realistic DOBs`)
}

async function main() {
  const userEmail = process.argv[2] || 'lambertpatrick09+admina@gmail.com'

  console.log('🚀 Starting Complete DOB Fix')
  console.log(`   User email: ${userEmail}`)

  try {
    // Get user and organization
    const { data: authData } = await supabase.auth.admin.listUsers()
    const user = authData.users.find(u => u.email === userEmail)

    if (!user) {
      console.error(`❌ User ${userEmail} not found`)
      process.exit(1)
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!membership) {
      console.error('❌ No organization found')
      process.exit(1)
    }

    const orgId = membership.organization_id
    console.log(`✅ Found organization: ${orgId}`)

    const startTime = Date.now()
    await fixAllDOBs(orgId)

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log('✅ FIX COMPLETE!')
    console.log('='.repeat(60))
    console.log(`⏱️  Time taken: ${duration} minutes`)
    console.log('\n💡 All animals now have realistic past DOBs!')
    console.log('   Sync your app to see the updated data.')
    console.log('='.repeat(60) + '\n')

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
