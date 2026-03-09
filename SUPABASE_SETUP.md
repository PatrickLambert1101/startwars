# Supabase Database Setup

## Problem: Database Resets on Refresh

Your app is losing data because:
1. **Local database (IndexedDB) is resetting** - This is a separate issue with LokiJS adapter
2. **Supabase is missing WatermelonDB sync columns** - Even if local DB worked, sync won't work without `_changed` and `_status` columns

## Solution: Apply Database Migrations

### Option 1: Manual SQL (Easiest - Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your HerdTrackr project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

5. **Copy and paste the ENTIRE contents of this file:**
   `supabase/migrations/00002_add_watermelondb_sync.sql`

6. Click **"Run"** (or press Cmd+Enter)

7. You should see: ✅ Success. No rows returned

### Option 2: Using Supabase CLI

```bash
# First, link your project (one-time setup)
npx supabase link --project-ref YOUR_PROJECT_REF

# Find your project ref:
# Go to https://supabase.com/dashboard → Your Project → Settings → General
# Look for "Reference ID"

# Then apply migrations
npx supabase db push
```

### Option 3: Run Setup Script

```bash
./scripts/setup-supabase.sh
```

---

## What This Migration Does

Adds the following to ALL tables:
- `_changed` column (required by WatermelonDB sync)
- `_status` column (required by WatermelonDB sync)
- Indexes on these columns for performance

Adds to `organizations` table specifically:
- `livestock_types` column (was missing!)
- `location` column (was missing!)

Creates new `treatment_protocols` table (was completely missing!)

---

## After Running Migration

### Step 1: Verify Migration Success

Go to Supabase Dashboard → **Table Editor** → **organizations**

You should see these columns:
- ✓ id
- ✓ remote_id
- ✓ name
- ✓ livestock_types (NEW)
- ✓ location (NEW)
- ✓ created_at
- ✓ updated_at
- ✓ is_deleted
- ✓ _changed (NEW)
- ✓ _status (NEW)

### Step 2: Clear Local Database

Your local IndexedDB still has the old schema and corrupted data. Clear it:

**Option A: Browser DevTools (Web/Simulator)**
1. Open Chrome DevTools (Cmd+Option+I)
2. Go to **Application** tab
3. Expand **IndexedDB** in left sidebar
4. Right-click **herdtrackr** → Delete
5. Close DevTools
6. Refresh page (Cmd+R)

**Option B: iOS Simulator**
```bash
# Clear all simulator data
xcrun simctl erase all

# Or reset just Safari data
xcrun simctl privacy booted reset all com.apple.mobilesafari

# Then restart app
npm start -- --ios
```

**Option C: Add Clear DB Script**
```bash
# Add this to package.json scripts:
"clear-db": "node -e \"indexedDB.deleteDatabase('herdtrackr')\""

# Then run:
npm run clear-db
```

### Step 3: Test Organization Creation

1. Refresh your app
2. Create a new organization
3. Add an animal
4. **Press R to refresh**
5. Organization should still be there! ✅

---

## Checking Supabase Data

Want to see if your organization is actually in Supabase?

### Using Supabase Dashboard

1. Go to **Table Editor** → **organizations**
2. You should see your org in the table
3. Click **memberships** to see your user is linked to the org

### Using SQL Query

Go to **SQL Editor** and run:

```sql
-- See all organizations
SELECT * FROM organizations;

-- See your organizations (as current user)
SELECT
  o.id,
  o.name,
  o.livestock_types,
  o.location,
  o.created_at,
  m.role
FROM organizations o
JOIN memberships m ON m.organization_id = o.id
WHERE m.user_id = auth.uid();

-- See all animals in your org
SELECT
  a.visual_tag,
  a.name,
  a.breed,
  a.sex,
  o.name as organization_name
FROM animals a
JOIN organizations o ON a.organization_id = o.id
JOIN memberships m ON m.organization_id = o.id
WHERE m.user_id = auth.uid();
```

---

## Troubleshooting

### Migration Error: "column already exists"

This is fine! It means you already ran part of the migration. The `IF NOT EXISTS` clauses prevent errors.

### Migration Error: "permission denied"

You need to be the project owner. Check your role in Supabase Dashboard → Settings → Team.

### Still Losing Data After Migration

1. **Verify migration applied:**
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'organizations'
   ORDER BY ordinal_position;
   ```

   Should include `_changed`, `_status`, `livestock_types`, `location`

2. **Clear local IndexedDB** (see Step 2 above)

3. **Check browser console for sync errors** (Cmd+Option+I → Console tab)

4. **Verify Supabase environment variables** in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Sync Still Not Working

Check app/services/sync.ts and verify:
- `migrationsEnabledAtVersion: 4` (should match schema version)
- All tables have `_changed` column in Supabase

---

## Understanding the Database Reset Issue

The logs show:
```
LOG  [🍉] [Loki] Initializing IndexedDB
LOG  [🍉] [Loki] Database loaded
LOG  [🍉] [Loki] Empty database, setting up
LOG  [🍉] [Loki] Database is now reset
LOG  [🍉] [Loki] Initializing IndexedDB  ← Double initialization!
```

**Why this happens:**
1. LokiJS adapter initializes
2. Finds existing database in IndexedDB
3. Detects schema version mismatch (expecting v4, found v3 or corrupted data)
4. **Resets entire database to v4**
5. You lose all data

**Why it keeps happening:**
- Each time you refresh, IndexedDB still has old/corrupted data
- LokiJS detects mismatch again
- Resets again
- Endless loop!

**The fix:**
- Clear IndexedDB completely (see Step 2 above)
- Start fresh with clean v4 schema
- From now on, data will persist properly

**Why Supabase matters:**
- Even if local DB works, without Supabase sync columns, your data won't sync
- If you reinstall app or switch devices, data is gone forever
- With proper Supabase setup + sync, data is backed up in cloud

---

## Next Steps After Setup

Once migration is applied and local DB is cleared:

1. ✅ Organizations will persist across refreshes
2. ✅ Sync will work (data backed up to Supabase)
3. ✅ You can access data from multiple devices
4. ✅ Data survives app reinstalls

You can now:
- Enable AutoSync (uncomment in app/app.tsx line 94)
- Deploy to production
- Add more users via memberships table
