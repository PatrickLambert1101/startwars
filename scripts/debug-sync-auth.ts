#!/usr/bin/env tsx
/**
 * Debug sync with actual user authentication
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  // Sign in as the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'lambertpatrick09+admina@gmail.com',
    password: 'password123', // Replace with actual password
  })

  if (authError) {
    console.error('❌ Auth error:', authError.message)
    return
  }

  console.log('✅ Signed in as:', authData.user?.email)
  console.log('   User ID:', authData.user?.id)

  // Now call sync_pull as the authenticated user
  const { data, error } = await supabase.rpc('sync_pull', { last_pulled_at: 0 })

  if (error) {
    console.error('\n❌ sync_pull error:', error)
  } else {
    console.log('\n✅ sync_pull response (authenticated):')
    console.log('  Organizations:', data.changes.organizations.created.length)
    console.log('  Memberships:', data.changes.memberships.created.length)
    console.log('  Animals:', data.changes.animals.created.length)
    console.log('  Pastures:', data.changes.pastures.created.length)

    if (data.changes.animals.created.length > 0) {
      console.log('\n  Sample animals:')
      data.changes.animals.created.slice(0, 3).forEach((a: any) => {
        console.log(`    - ${a.name} (${a.visual_tag})`)
      })
    }
  }

  await supabase.auth.signOut()
}

main()
