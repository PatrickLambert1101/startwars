#!/usr/bin/env tsx
/**
 * Demo Data Generator with Users
 *
 * Creates a complete demo setup:
 * - 1 organization
 * - 6 users (1 admin + 5 workers) with email aliases
 * - 6000 cattle with pastures, health records, weight records, breeding records
 *
 * Usage:
 *   npx tsx scripts/generate-demo-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { randomUUID } from 'crypto'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set in your .env file')
  process.exit(1)
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  }
})

const BASE_EMAIL = 'lambertpatrick09'
const EMAIL_DOMAIN = 'gmail.com'
const DEFAULT_PASSWORD = 'DemoPassword123!' // Change this or make it configurable
const CATTLE_COUNT = 6000
const ORG_NAME = 'Demo Ranch'

interface UserInfo {
  email: string
  role: 'admin' | 'worker'
  displayName: string
}

async function createOrganization(): Promise<string> {
  console.log(`\n📋 Creating organization: ${ORG_NAME}...`)

  let retries = 3
  let lastError: any

  while (retries > 0) {
    try {
      const orgId = randomUUID()
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          id: orgId,
          name: ORG_NAME,
          livestock_types: ['cattle'],
          location: 'Demo Location, South Africa',
          subscription_tier: 'commercial',
          subscription_status: 'active',
          default_breeds: { cattle: 'Nguni' }
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating organization:', error.message)
        throw error
      }

      console.log(`✅ Organization created with ID: ${data.id}`)
      return data.id
    } catch (err: any) {
      lastError = err
      retries--
      if (retries > 0) {
        console.log(`⚠️  Connection failed, retrying... (${retries} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  console.error('❌ Failed after multiple retries:', lastError.message)
  throw lastError
}

async function createUsers(): Promise<UserInfo[]> {
  const users: UserInfo[] = [
    { email: `${BASE_EMAIL}+admina@${EMAIL_DOMAIN}`, role: 'admin', displayName: 'Admin User' },
    { email: `${BASE_EMAIL}+worker1@${EMAIL_DOMAIN}`, role: 'worker', displayName: 'Worker One' },
    { email: `${BASE_EMAIL}+worker2@${EMAIL_DOMAIN}`, role: 'worker', displayName: 'Worker Two' },
    { email: `${BASE_EMAIL}+worker3@${EMAIL_DOMAIN}`, role: 'worker', displayName: 'Worker Three' },
    { email: `${BASE_EMAIL}+worker4@${EMAIL_DOMAIN}`, role: 'worker', displayName: 'Worker Four' },
    { email: `${BASE_EMAIL}+worker5@${EMAIL_DOMAIN}`, role: 'worker', displayName: 'Worker Five' },
  ]

  console.log(`\n👥 Creating ${users.length} users in Supabase Auth...`)

  for (const user of users) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          display_name: user.displayName
        }
      })

      if (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message)
        throw error
      }

      console.log(`✅ Created ${user.role}: ${user.email}`)
    } catch (err: any) {
      if (err.message?.includes('already registered') || err.code === 'email_exists') {
        console.log(`⚠️  User ${user.email} already exists, continuing...`)
      } else {
        console.error(`⚠️  Unexpected error creating ${user.email}:`, err.message)
        console.log(`   Continuing with remaining users...`)
      }
    }
  }

  return users
}

async function linkUsersToOrganization(organizationId: string, users: UserInfo[]): Promise<void> {
  console.log(`\n🔗 Linking users to organization...`)

  for (const user of users) {
    // Get the user ID from Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error fetching users:', authError.message)
      throw authError
    }

    const matchedUser = authUser.users.find(u => u.email === user.email)

    if (!matchedUser) {
      console.error(`❌ Could not find user ${user.email} in Supabase Auth`)
      continue
    }

    // Create membership record
    const { error: memberError } = await supabase
      .from('memberships')
      .insert({
        id: randomUUID(),
        organization_id: organizationId,
        user_id: matchedUser.id,
        user_email: user.email,
        user_display_name: user.displayName,
        role: user.role,
        is_active: true,
        joined_at: new Date().toISOString()
      })

    if (memberError) {
      // Check if it's a duplicate key error
      if (memberError.message?.includes('duplicate') || memberError.code === '23505') {
        console.log(`⚠️  Membership already exists for ${user.email}, skipping...`)
      } else {
        console.error(`❌ Error creating membership for ${user.email}:`, memberError.message)
        throw memberError
      }
    } else {
      console.log(`✅ Linked ${user.role} ${user.email} to organization`)
    }
  }
}

async function generateCattleData(organizationId: string): Promise<void> {
  console.log(`\n🐄 Generating ${CATTLE_COUNT} cattle with test data...`)
  console.log('⚠️  This will take several minutes. Please be patient...\n')

  // Use dynamic import to run the cattle generation script
  const { execSync } = await import('child_process')

  try {
    execSync(
      `npx tsx ${__dirname}/generate-cattle-supabase.ts ${organizationId} ${CATTLE_COUNT}`,
      { stdio: 'inherit' }
    )
  } catch (error: any) {
    console.error('❌ Failed to generate cattle data:', error.message)
    throw error
  }
}

async function displaySummary(organizationId: string, users: UserInfo[]): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('✅ SETUP COMPLETE!')
  console.log('='.repeat(60))
  console.log(`\n📋 Organization ID: ${organizationId}`)
  console.log(`📧 Organization Name: ${ORG_NAME}`)
  console.log(`\n👥 Users created (Password: ${DEFAULT_PASSWORD}):`)
  console.log('─'.repeat(60))

  users.forEach(user => {
    const roleIcon = user.role === 'admin' ? '👑' : '👷'
    console.log(`${roleIcon} ${user.displayName.padEnd(20)} | ${user.email}`)
  })

  console.log('\n🎉 All data has been generated!')
  console.log('─'.repeat(60))
  console.log('You can now log into your React Native app with any of the above credentials.')
  console.log('\n💡 The app will sync the data from Supabase automatically.')
  console.log('='.repeat(60) + '\n')
}

async function main() {
  try {
    console.log('🚀 Starting Demo Data Generation...')
    console.log('This will create:')
    console.log(`  - 1 organization`)
    console.log(`  - 6 users (1 admin + 5 workers)`)
    console.log(`  - ${CATTLE_COUNT} cattle (to be generated in-app)`)
    console.log('')

    // Step 1: Create organization
    const orgId = await createOrganization()

    // Step 2: Create users
    const users = await createUsers()

    // Step 3: Link users to organization
    await linkUsersToOrganization(orgId, users)

    // Step 4: Instructions for cattle generation
    await generateCattleData(orgId)

    // Display summary
    await displaySummary(orgId, users)

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
