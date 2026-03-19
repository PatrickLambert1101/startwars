#!/usr/bin/env tsx
/**
 * Manage Super Users
 *
 * This script allows you to add or remove super users who get full commercial access
 * regardless of their subscription tier.
 *
 * Usage:
 *   npm run super-user:add <email> [notes]
 *   npm run super-user:remove <email>
 *   npm run super-user:list
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set in your .env file')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addSuperUser(email: string, notes?: string) {
  console.log(`\n🔐 Adding super user: ${email}`)

  try {
    const { data, error } = await supabase
      .rpc('add_super_user', {
        user_email: email,
        admin_notes: notes || null
      })

    if (error) {
      console.error('❌ Error adding super user:', error.message)
      return
    }

    console.log(`✅ Successfully added ${email} as a super user!`)
    console.log(`   ID: ${data}`)
    if (notes) {
      console.log(`   Notes: ${notes}`)
    }
    console.log(`\n   They will have full commercial access when they log in.`)
  } catch (error: any) {
    console.error('❌ Failed to add super user:', error.message)
  }
}

async function removeSuperUser(email: string) {
  console.log(`\n🔓 Removing super user: ${email}`)

  try {
    const { data, error } = await supabase
      .from('super_users')
      .update({ is_active: false })
      .eq('email', email)
      .select()

    if (error) {
      console.error('❌ Error removing super user:', error.message)
      return
    }

    if (!data || data.length === 0) {
      console.log(`⚠️  No super user found with email: ${email}`)
      return
    }

    console.log(`✅ Successfully removed ${email} from super users!`)
  } catch (error: any) {
    console.error('❌ Failed to remove super user:', error.message)
  }
}

async function listSuperUsers() {
  console.log(`\n📋 Super Users List:\n`)

  try {
    const { data, error } = await supabase
      .from('super_users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching super users:', error.message)
      return
    }

    if (!data || data.length === 0) {
      console.log('   No super users found.')
      return
    }

    console.log(`   Total: ${data.length}\n`)

    data.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`)
      if (user.notes) {
        console.log(`      Notes: ${user.notes}`)
      }
      console.log(`      Granted: ${new Date(user.granted_at).toLocaleString()}`)
      if (user.granted_by) {
        console.log(`      Granted by: ${user.granted_by}`)
      }
      console.log('')
    })
  } catch (error: any) {
    console.error('❌ Failed to list super users:', error.message)
  }
}

// Main execution
const command = process.argv[2]
const email = process.argv[3]
const notes = process.argv[4]

async function main() {
  switch (command) {
    case 'add':
      if (!email) {
        console.error('❌ Please provide an email address')
        console.log('Usage: npm run super-user:add <email> [notes]')
        process.exit(1)
      }
      await addSuperUser(email, notes)
      break

    case 'remove':
      if (!email) {
        console.error('❌ Please provide an email address')
        console.log('Usage: npm run super-user:remove <email>')
        process.exit(1)
      }
      await removeSuperUser(email)
      break

    case 'list':
      await listSuperUsers()
      break

    default:
      console.log('\n📖 Super User Management\n')
      console.log('Usage:')
      console.log('  npm run super-user:add <email> [notes]     - Add a super user')
      console.log('  npm run super-user:remove <email>          - Remove a super user')
      console.log('  npm run super-user:list                    - List all super users')
      console.log('\nExamples:')
      console.log('  npm run super-user:add pat@example.com "Beta tester"')
      console.log('  npm run super-user:remove pat@example.com')
      console.log('  npm run super-user:list\n')
      process.exit(1)
  }

  process.exit(0)
}

main()
