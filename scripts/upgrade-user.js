#!/usr/bin/env node

/**
 * User Upgrade Script for HerdTrackr
 *
 * Upgrades a user's organization from free (starter) to farm tier.
 *
 * Usage:
 *   node scripts/upgrade-user.js user@example.com
 *   node scripts/upgrade-user.js user@example.com --tier=commercial
 *   node scripts/upgrade-user.js user@example.com --days=30
 *
 * Options:
 *   --tier=<tier>     Subscription tier: starter, farm, or commercial (default: farm)
 *   --days=<days>     Number of days for subscription (default: 30)
 *   --status=<status> Subscription status: active, trial, cancelled, expired (default: active)
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

// Valid tiers and statuses
const VALID_TIERS = ['starter', 'farm', 'commercial']
const VALID_STATUSES = ['active', 'trial', 'cancelled', 'expired']

// Pricing info for display
const PRICING = {
  starter: { name: 'Starter', price: 'R0/month', animals: 100 },
  farm: { name: 'Farm', price: 'R245/month', animals: 1000 },
  commercial: { name: 'Commercial', price: 'R999/month', animals: 'Unlimited' },
}

function parseArgs() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: node scripts/upgrade-user.js <email> [options]')
    console.log('\nOptions:')
    console.log('  --tier=<tier>       Subscription tier: starter, farm, or commercial (default: farm)')
    console.log('  --days=<days>       Number of days for subscription (default: 30)')
    console.log('  --status=<status>   Subscription status: active, trial, cancelled, expired (default: active)')
    console.log('\nExamples:')
    console.log('  node scripts/upgrade-user.js user@example.com')
    console.log('  node scripts/upgrade-user.js user@example.com --tier=commercial')
    console.log('  node scripts/upgrade-user.js user@example.com --tier=farm --days=365')
    console.log('  node scripts/upgrade-user.js user@example.com --tier=farm --status=trial --days=14')
    process.exit(0)
  }

  const email = args[0]
  let tier = 'farm'
  let days = 30
  let status = 'active'

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--tier=')) {
      tier = args[i].substring(7)
    } else if (args[i].startsWith('--days=')) {
      days = parseInt(args[i].substring(7))
    } else if (args[i].startsWith('--status=')) {
      status = args[i].substring(9)
    }
  }

  if (!VALID_TIERS.includes(tier)) {
    console.error(`❌ Invalid tier: ${tier}`)
    console.error(`   Valid tiers: ${VALID_TIERS.join(', ')}`)
    process.exit(1)
  }

  if (!VALID_STATUSES.includes(status)) {
    console.error(`❌ Invalid status: ${status}`)
    console.error(`   Valid statuses: ${VALID_STATUSES.join(', ')}`)
    process.exit(1)
  }

  if (isNaN(days) || days <= 0) {
    console.error(`❌ Invalid days: ${days}`)
    process.exit(1)
  }

  return { email, tier, days, status }
}

async function upgradeUser(email, tier, days, status) {
  // Validate configuration
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('❌ Missing Supabase configuration!')
    console.error('   Make sure .env file contains:')
    console.error('   - EXPO_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SECRET_KEY')
    process.exit(1)
  }

  // Create Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('\n🔍 Looking up user...')
  console.log(`   Email: ${email}\n`)

  // Find user by email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) {
    console.error('❌ Error fetching users:', userError.message)
    process.exit(1)
  }

  const user = userData.users.find(u => u.email === email)

  if (!user) {
    console.error(`❌ User not found: ${email}`)
    console.error('   Make sure the email address is correct.')
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.email}`)
  console.log(`   User ID: ${user.id}\n`)

  // Find user's organization(s)
  const { data: memberships, error: membershipError } = await supabase
    .from('memberships')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (membershipError) {
    console.error('❌ Error fetching memberships:', membershipError.message)
    process.exit(1)
  }

  if (!memberships || memberships.length === 0) {
    console.error(`❌ No active organizations found for ${email}`)
    console.error('   User must have at least one organization.')
    process.exit(1)
  }

  console.log(`📋 Found ${memberships.length} organization(s):\n`)

  // Calculate subscription dates
  const now = new Date()
  const startsAt = now.toISOString()
  const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

  const tierInfo = PRICING[tier]

  // Upgrade each organization
  let successCount = 0
  for (const membership of memberships) {
    const org = membership.organizations
    const currentTier = org.subscription_tier || 'starter'

    console.log(`   Organization: ${org.name}`)
    console.log(`   Current tier: ${currentTier}`)
    console.log(`   Role: ${membership.role}`)

    // Update organization subscription
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_tier: tier,
        subscription_starts_at: startsAt,
        subscription_ends_at: endsAt,
        subscription_status: status,
        updated_at: now.toISOString(),
      })
      .eq('id', org.id)

    if (updateError) {
      console.error(`   ❌ Failed to upgrade: ${updateError.message}\n`)
    } else {
      console.log(`   ✅ Upgraded to ${tier}\n`)
      successCount++
    }
  }

  // Summary
  console.log('━'.repeat(60))
  console.log('\n✨ Upgrade Summary:\n')
  console.log(`   User: ${email}`)
  console.log(`   Organizations upgraded: ${successCount}/${memberships.length}`)
  console.log(`   New tier: ${tierInfo.name} (${tierInfo.price})`)
  console.log(`   Max animals: ${tierInfo.animals}`)
  console.log(`   Status: ${status}`)
  console.log(`   Valid from: ${new Date(startsAt).toLocaleDateString()}`)
  console.log(`   Valid until: ${new Date(endsAt).toLocaleDateString()}`)
  console.log(`   Duration: ${days} days\n`)

  if (tier === 'starter') {
    console.log('⚠️  Note: User downgraded to free Starter plan.')
  } else if (status === 'trial') {
    console.log('💡 Note: This is a trial subscription.')
  }

  console.log('\n✅ Done!\n')
}

// Run the script
const { email, tier, days, status } = parseArgs()
upgradeUser(email, tier, days, status).catch(err => {
  console.error('\n❌ Unexpected error:', err.message)
  process.exit(1)
})
