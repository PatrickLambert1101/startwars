# HerdTrackr Subscription System Setup

This guide explains how to upgrade users between subscription tiers.

## Overview

The subscription system is already set up! The database has been migrated with subscription fields via Supabase CLI.

**What's included:**
- ✅ Database fields added to `organizations` table
- ✅ Local app schema updated (version 11)
- ✅ Context provider reads from database
- ✅ Upgrade screen shows all 3 tiers
- ✅ New organizations default to "starter" tier

## Upgrade a User

### Basic Upgrade (Farm Plan)

```bash
node scripts/upgrade-user.js user@example.com
```

This will:
- Find the user by email
- Upgrade all their organizations to **Farm** tier (R245/month)
- Set subscription valid for 30 days
- Status: active

### Upgrade to Commercial Plan

```bash
node scripts/upgrade-user.js user@example.com --tier=commercial
```

### Upgrade with Custom Duration

```bash
# 1 year subscription
node scripts/upgrade-user.js user@example.com --days=365

# 14 day trial
node scripts/upgrade-user.js user@example.com --status=trial --days=14
```

### All Options

```bash
node scripts/upgrade-user.js <email> [options]

Options:
  --tier=<tier>       starter, farm, or commercial (default: farm)
  --days=<days>       Number of days for subscription (default: 30)
  --status=<status>   active, trial, cancelled, expired (default: active)
```

## Subscription Tiers

| Tier | Price | Animals | Pastures | Features |
|------|-------|---------|----------|----------|
| **Starter** | R0/month | 100 | 1 | Camera scanning, basic records, 1 user |
| **Farm** | R245/month | 1,000 | 15 | Full tracking, breeding, reports, 5 users |
| **Commercial** | R999/month | Unlimited | Unlimited | RFID scanner, analytics, API access |

## Example Usage

```bash
# Upgrade john@farm.co.za to Farm plan for 1 month
node scripts/upgrade-user.js john@farm.co.za

# Upgrade to Commercial plan for 1 year
node scripts/upgrade-user.js bigranch@example.com --tier=commercial --days=365

# Give 14-day free trial of Farm plan
node scripts/upgrade-user.js newuser@test.com --status=trial --days=14

# Downgrade to free tier
node scripts/upgrade-user.js user@example.com --tier=starter
```

## Troubleshooting

### "Missing Supabase configuration"

Make sure your `.env` file contains:
```
EXPO_PUBLIC_SUPABASE_URL=https://geczhyukynirvpdjnbel.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

### "User not found"

- Check the email address is correct (case-sensitive)
- Make sure the user has signed up in the app
- Check if they verified their email

### "No active organizations found"

The user needs to:
1. Sign up in the app
2. Complete the organization setup wizard
3. Have at least one active organization

## Manual Database Upgrade (Alternative)

If you prefer to upgrade users directly in the Supabase dashboard:

1. Go to Table Editor: https://supabase.com/dashboard/project/geczhyukynirvpdjnbel/editor
2. Open the `organizations` table
3. Find the organization you want to upgrade
4. Edit the row and set:
   - `subscription_tier` = `farm` or `commercial`
   - `subscription_status` = `active`
   - `subscription_starts_at` = current date
   - `subscription_ends_at` = future date (e.g., 30 days from now)

## Integrating with RevenueCat (Future)

Currently, subscriptions are stored in the database only. To integrate with RevenueCat:

1. Update `app/context/SubscriptionContext.tsx` to read from database
2. Set up RevenueCat webhooks to update database when purchases happen
3. Create webhook handler to sync RevenueCat events to `organizations` table

See RevenueCat documentation for webhook setup:
https://www.revenuecat.com/docs/webhooks
