#!/usr/bin/env tsx
/**
 * Set up the App Store / Play review account.
 *
 * Creates review@herdtrackr.co.za, links it to the Demo Ranch organization
 * (which holds the generated demo herd), and grants super-user status so the
 * reviewer sees the full paid feature set without a purchase.
 *
 * The app contains a matching OTP bypass: entering this email on the sign-in
 * screen with the fixed review code signs in with REVIEW_PASSWORD under the
 * hood (see AuthContext).
 */

import { randomUUID } from 'crypto'
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

// Pulled from .env so no credential lives in source. These must match the
// EXPO_PUBLIC_REVIEW_* values the app is built with (app/context/AuthContext.tsx):
//   REVIEW_EMAIL       == EXPO_PUBLIC_REVIEW_EMAIL
//   REVIEW_PASSWORD    == EXPO_PUBLIC_REVIEW_PASSWORD
const REVIEW_EMAIL = process.env.REVIEW_EMAIL
const REVIEW_PASSWORD = process.env.REVIEW_PASSWORD

if (!REVIEW_EMAIL || !REVIEW_PASSWORD) {
  console.error('❌ Missing REVIEW_EMAIL / REVIEW_PASSWORD in .env')
  process.exit(1)
}

const DEMO_ORG_ID = '68b89705-d443-41f3-9923-ab010404e429' // Demo Ranch

async function main() {
  console.log(`\n🔍 Setting up review account: ${REVIEW_EMAIL}`)

  // 1. Create (or update) the auth user
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: REVIEW_EMAIL,
    password: REVIEW_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: 'App Review' },
  })

  let userId = created?.user?.id
  if (createError) {
    if (createError.message?.includes('already') || (createError as any).code === 'email_exists') {
      console.log('⚠️  User already exists — resetting password')
      const { data: list } = await supabase.auth.admin.listUsers()
      const existing = list?.users.find((u) => u.email === REVIEW_EMAIL)
      if (!existing) throw new Error('User exists but could not be found')
      userId = existing.id
      const { error: updError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: REVIEW_PASSWORD,
        email_confirm: true,
      })
      if (updError) throw updError
    } else {
      throw createError
    }
  }
  console.log(`✅ Auth user ready: ${userId}`)

  // 2. Link to Demo Ranch
  const { error: memberError } = await supabase.from('memberships').insert({
    id: randomUUID(),
    organization_id: DEMO_ORG_ID,
    user_id: userId,
    user_email: REVIEW_EMAIL,
    user_display_name: 'App Review',
    role: 'admin',
    is_active: true,
    joined_at: new Date().toISOString(),
  })
  if (memberError) {
    if (memberError.message?.includes('duplicate') || memberError.code === '23505') {
      console.log('⚠️  Membership already exists, skipping')
    } else {
      throw memberError
    }
  } else {
    console.log('✅ Linked to Demo Ranch')
  }

  // 3. Grant super-user (full paid feature set, no purchase needed)
  const { error: superError } = await supabase.rpc('add_super_user', {
    user_email: REVIEW_EMAIL,
    admin_notes: 'App Store / Play review account',
  })
  if (superError) {
    console.error('⚠️  add_super_user failed:', superError.message)
  } else {
    console.log('✅ Super-user granted (pro access)')
  }

  // 4. Sanity check: password sign-in works
  const anon = createClient(SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email: REVIEW_EMAIL,
    password: REVIEW_PASSWORD,
  })
  if (signInError) {
    console.error('❌ Sign-in check FAILED:', signInError.message)
    process.exit(1)
  }
  console.log(`✅ Sign-in check passed (user ${signIn.user?.id})`)
  console.log('\n🎉 Review account ready.')
}

main()
