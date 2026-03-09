# Reset Database and Start Fresh

Your Supabase database has incomplete migrations. Let's wipe everything and start clean.

## Quick Reset (Recommended)

### Step 1: Go to Supabase SQL Editor

1. Open https://supabase.com/dashboard
2. Select your HerdTrackr project
3. Click **SQL Editor** in left sidebar
4. Click **New query**

### Step 2: Run Reset Migration

Copy and paste the **entire contents** of this file:
```
supabase/migrations/00000_reset_database.sql
```

Click **Run** (or Cmd+Enter)

You should see: `✅ All tables dropped successfully`

### Step 3: Run Complete Schema Migration

Create a **new query** in SQL Editor.

Copy and paste the **entire contents** of this file:
```
supabase/migrations/00001_complete_schema.sql
```

Click **Run** (or Cmd+Enter)

You should see a success message listing all tables created.

### Step 4: Clear Local Database

Your app still has old data locally. Clear it:

**Option A: Clear app data (iOS Simulator)**
```bash
# Reset simulator completely
xcrun simctl erase all

# Then restart
npm start -- --ios
```

**Option B: Clear app data (Android)**
```bash
# Uninstall and reinstall
adb uninstall com.startwars  # or your package name

# Then rebuild
npm run android
```

**Option C: Clear browser storage (Web)**
1. Open DevTools (Cmd+Option+I)
2. Go to Application tab
3. Expand IndexedDB → Right-click → Delete
4. Refresh page

### Step 5: Create a New Organization

1. Launch app
2. Go through organization setup wizard
3. You now have a clean database!

---

## Using Supabase CLI (Alternative Method)

If you have Supabase CLI installed:

```bash
# Link your project (one-time)
npx supabase link --project-ref YOUR_PROJECT_REF

# Find your project ref at:
# https://supabase.com/dashboard → Your Project → Settings → General

# Run reset
npx supabase db reset

# Or just push migrations
npx supabase db push
```

---

## What This Does

**00000_reset_database.sql:**
- Drops ALL existing tables
- Removes all data
- Gives you a clean slate

**00001_complete_schema.sql:**
- Creates all tables from scratch
- Includes all features:
  - ✅ User tracking (created_by_user_id, created_by_name)
  - ✅ Photo support (photos column on all relevant tables)
  - ✅ WatermelonDB sync columns (_changed, _status)
  - ✅ Row Level Security (RLS) policies
  - ✅ Proper indexes
  - ✅ Foreign key relationships
- Creates these tables:
  - organizations
  - memberships
  - organization_members
  - pastures
  - animals
  - treatment_protocols
  - health_records
  - weight_records
  - breeding_records
  - pasture_movements

---

## After Reset

### Update Local Schema Version

Your app expects schema version 8. This is already correct in your code:

```typescript
// app/db/schema.ts
export const schema = appSchema({
  version: 8,  // ✅ Already correct
  tables: [...]
})
```

### Create Supabase Storage Bucket

Follow the guide in `PHOTO_STORAGE_SETUP.md` to set up photo storage:

1. Create bucket `herdtrackr-photos`
2. Make it public
3. Set up 3 RLS policies (copy/paste from guide)

---

## Troubleshooting

### "relation already exists"

If you see this error, you didn't run the reset migration first. Run `00000_reset_database.sql` before running `00001_complete_schema.sql`.

### "permission denied"

You need to be the project owner to run these migrations. Check your role in:
Supabase Dashboard → Settings → Team

### Still getting errors?

1. Make sure you're running the SQL in the **correct project**
2. Check you're logged in to Supabase Dashboard
3. Try refreshing the SQL Editor page
4. If all else fails, create a brand new Supabase project and update your env vars

---

## Summary

```bash
# Step 1: Run in Supabase SQL Editor
supabase/migrations/00000_reset_database.sql

# Step 2: Run in Supabase SQL Editor
supabase/migrations/00001_complete_schema.sql

# Step 3: Clear local app data
xcrun simctl erase all  # iOS
# or uninstall/reinstall for Android

# Step 4: Restart app
npm start

# Step 5: Done! Create new organization and start fresh
```

You'll have a completely clean database with all features enabled (user tracking, photos, sync, RLS).
