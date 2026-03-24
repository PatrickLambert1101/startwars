#!/usr/bin/env tsx
/**
 * Check membership is_active status
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

async function main() {
  const targetEmail = 'lambertpatrick09+admina@gmail.com'

  const { data: memberships } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_email', targetEmail)

  console.log('🔍 Memberships for', targetEmail, '\n')
  memberships?.forEach(m => {
    console.log({
      organization_id: m.organization_id,
      user_email: m.user_email,
      role: m.role,
      is_active: m.is_active,
      is_deleted: m.is_deleted,
    })
  })

  // Get user_id from auth
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users.users.find(u => u.email === targetEmail)

  if (user) {
    console.log('\n👤 User ID:', user.id)

    // Test the sync_pull query
    const { data, error } = await supabase.rpc('sync_pull', { last_pulled_at: 0 })

    if (error) {
      console.log('\n❌ sync_pull error:', error)
    } else {
      console.log('\n✅ sync_pull response:')
      console.log('  Full response:', JSON.stringify(data, null, 2))

      if (data && data.changes) {
        const orgs = Array.isArray(data.changes.organizations?.created)
          ? data.changes.organizations.created
          : (data.changes.organizations?.created || [])
        const mems = Array.isArray(data.changes.memberships?.created)
          ? data.changes.memberships.created
          : (data.changes.memberships?.created || [])
        const animals = Array.isArray(data.changes.animals?.created)
          ? data.changes.animals.created
          : (data.changes.animals?.created || [])
        const pastures = Array.isArray(data.changes.pastures?.created)
          ? data.changes.pastures.created
          : (data.changes.pastures?.created || [])

        console.log('  Organizations:', orgs.length)
        console.log('  Memberships:', mems.length)
        console.log('  Animals:', animals.length)
        console.log('  Pastures:', pastures.length)
      }
    }
  }
}

main()
