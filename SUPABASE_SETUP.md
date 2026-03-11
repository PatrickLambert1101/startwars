# Supabase Database Setup

## Overview

HerdTrackr uses Supabase as the backend database with WatermelonDB for local-first data management. All migrations are managed via **Supabase CLI**.

## Prerequisites

- Supabase CLI installed globally
- Project linked to remote Supabase instance
- `.env` file configured with Supabase credentials

## Database Management

### Applying Migrations

All migrations are in `supabase/migrations/` and applied via CLI:

```bash
# Push all pending migrations to remote database
supabase db push
```

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new my_feature_name

# Edit the file: supabase/migrations/XXXXX_my_feature_name.sql
# Add your SQL changes

# Apply to remote
supabase db push
```

### Reset Database (Fresh Start)

```bash
# WARNING: This deletes ALL data!
supabase db reset --linked
```

This will:
1. Drop all tables and data
2. Reapply all migrations from scratch
3. Give you a clean database state

## Current Schema

The database includes these tables:

### Core Tables
- `organizations` - Farm/ranch organizations
- `memberships` - User access to organizations
- `invites` - Pending organization invitations

### Livestock Management
- `animals` - Individual animals with tags, breeds, health status
- `pastures` - Grazing areas and rotational management
- `pasture_movements` - Animal movement history

### Health & Records
- `health_records` - Vaccinations, treatments, vet visits
- `weight_records` - Weight tracking with condition scores
- `breeding_records` - Breeding dates, outcomes, lineage
- `treatment_protocols` - Reusable treatment templates

### Subscription Management
- Organizations have subscription fields:
  - `subscription_tier` - starter | farm | commercial
  - `subscription_status` - active | cancelled | expired | trial
  - `subscription_starts_at` - Start date
  - `subscription_ends_at` - End date

## WatermelonDB Sync Columns

All tables include these columns for local-first sync:
- `_changed` - Timestamp of last change
- `_status` - Sync status (created, updated, deleted)
- `is_deleted` - Soft delete flag
- `remote_id` - Server-side ID

## Row Level Security (RLS)

All tables have RLS enabled with policies:
- **Organizations**: Members can view, admins can update
- **Animals/Records**: Organization members have full access
- **Memberships**: Users see own memberships, admins see all in org
- **Invites**: Admins can create, anyone can view by code

## Sync Functions

The database includes RPC functions for efficient sync:
- `sync_pull(last_pulled_at)` - Get changes since timestamp
- `sync_push(changes)` - Apply local changes to server

## Environment Setup

Required in `.env`:

```bash
# Client-side (bundled in app)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Server-side (for scripts only - never in app)
SUPABASE_SECRET_KEY=your_service_role_key
```

## Verifying Database State

### Check Applied Migrations

```bash
supabase migration list
```

Shows which migrations are applied locally vs remotely.

### View Table Structure

Go to Supabase Dashboard → Table Editor to browse:
- https://supabase.com/dashboard/project/geczhyukynirvpdjnbel/editor

### Query Data

SQL Editor: https://supabase.com/dashboard/project/geczhyukynirvpdjnbel/sql/new

```sql
-- See all organizations
SELECT * FROM organizations;

-- Check subscription tiers
SELECT name, subscription_tier, subscription_status FROM organizations;

-- See animals with their org
SELECT a.visual_tag, a.name, o.name as org_name
FROM animals a
JOIN organizations o ON a.organization_id = o.id;
```

## Local Database (IndexedDB)

The app uses WatermelonDB with LokiJS adapter for local storage.

### Clearing Local Data

If you need to clear local IndexedDB:

**Browser/Simulator:**
1. Chrome DevTools → Application → IndexedDB
2. Right-click `herdtrackr` → Delete
3. Refresh app

**iOS Simulator:**
```bash
xcrun simctl erase all
```

## Migration History

Current migrations in order:
1. `00000_reset_database.sql` - Clean slate
2. `00001_complete_schema.sql` - All tables, RLS, functions
3. `00002_numeric_invite_codes.sql` - Invite code format
4. `00003-00008` - RLS and storage fixes
5. `00009` - RPC sync functions
6. `00010-00011` - Sync improvements
7. `00012_add_herd_tag.sql` - Group tagging feature
8. `00013_add_subscription_tier.sql` - Subscription management

## Troubleshooting

### "Migration already applied" errors

This is normal - migrations are idempotent with `IF NOT EXISTS` clauses.

### "Connection refused" when pushing

Check your Supabase project is linked:
```bash
supabase status
```

If not linked:
```bash
supabase link --project-ref geczhyukynirvpdjnbel
```

### Data not syncing

1. Check console for sync errors
2. Verify environment variables in `.env`
3. Confirm RPC functions exist in database
4. Clear local IndexedDB and resync

### Permission denied

Ensure you're using the service role key for admin operations:
```bash
export SUPABASE_SECRET_KEY=your_service_role_key
```

## Best Practices

1. **Always use Supabase CLI** for migrations
2. **Never manually edit database** via dashboard (use migrations)
3. **Test migrations locally first** with `supabase db reset`
4. **Keep migrations small and focused** on one feature
5. **Use descriptive migration names** like `add_herd_tagging`
6. **Commit migrations to git** so team stays in sync

## Next Steps

- See `SUBSCRIPTION_SETUP.md` for user upgrade scripts
- See `DEPLOYMENT.md` for production deployment
- See `USER_MANAGEMENT_COMPLETE.md` for team management
