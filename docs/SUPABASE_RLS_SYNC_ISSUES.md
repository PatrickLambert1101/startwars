# Supabase RLS + WatermelonDB Sync Issues

## Problem Overview

When syncing locally-created organizations from WatermelonDB to Supabase, we repeatedly encounter RLS (Row-Level Security) policy violations:

```
ERROR: new row violates row-level security policy for table "organizations"
Code: 42501
```

This issue has occurred multiple times during development and requires careful understanding of the interaction between:
- WatermelonDB's local-first database
- Supabase's sync mechanism (upsert operations)
- RLS policies protecting data
- PostgreSQL triggers that auto-create memberships

## Root Cause Analysis

### The Local-First Flow

1. **User creates organization locally**:
   - WatermelonDB creates `Organization` record with UUID (e.g., `abc-123`)
   - App also creates `OrganizationMember` record linking user to org
   - Both records exist only locally at this point

2. **Sync attempts to push to Supabase**:
   - Sync calls `.upsert()` on both tables
   - Supabase receives organization with ID `abc-123`
   - **Critical issue**: `.upsert()` requires BOTH `INSERT` and `UPDATE` policies to pass

### Why Upsert Needs Both Policies

Even for truly new records, Supabase's `.upsert()` internally:
1. Checks if record with that ID exists
2. If not found → performs INSERT (checks INSERT policy)
3. If found → performs UPDATE (checks UPDATE policy)
4. **BUT**: RLS evaluates BOTH policies even for new records as a safety measure

### The Policy Chicken-and-Egg Problem

Original policies:
```sql
-- INSERT: Allow authenticated users
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- UPDATE: Only allow if you're an admin
CREATE POLICY "Admins can update organizations"
  ON organizations FOR UPDATE
  USING (public.is_org_admin(id));
```

The problem:
- Sync tries to upsert org `abc-123`
- INSERT policy passes ✓
- UPDATE policy checks `is_org_admin(abc-123)`
- But membership doesn't exist yet! ✗
- Even though this is a new record, the UPDATE check fails
- Result: **RLS violation**

### The Trigger Complication

We have a PostgreSQL trigger that auto-creates admin membership:
```sql
CREATE TRIGGER org_auto_membership
  AFTER INSERT ON organizations
  EXECUTE FUNCTION auto_add_org_owner();
```

This creates ANOTHER problem:
- Local app creates membership manually
- Trigger tries to create membership automatically
- Result: Duplicate membership attempts (though we fixed this with idempotency check)

## Solution

### 1. Make UPDATE Policy Time-Based

Allow updates for newly-created organizations within a time window:

```sql
CREATE POLICY "Admins can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(id) OR
    created_at > NOW() - INTERVAL '30 seconds'
  )
  WITH CHECK (
    public.is_org_admin(id) OR
    created_at > NOW() - INTERVAL '30 seconds'
  );
```

**Why this works**:
- During sync, the org was just created (< 30 seconds ago)
- UPDATE policy allows modifications during this grace period
- After sync completes and membership exists, normal `is_org_admin()` check takes over
- 30 seconds is long enough for sync but short enough for security

### 2. Make Trigger Idempotent

Prevent duplicate membership creation:

```sql
CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if membership doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = NEW.id
      AND user_id = auth.uid()
  ) THEN
    INSERT INTO public.memberships (...)
    VALUES (...);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why this works**:
- If local app already created membership → trigger skips
- If trigger runs first → creates membership
- Either way, only one membership exists

## How to Apply the Fix

1. **Copy the SQL** from `/supabase/migrations/00004_fix_org_insert_rls.sql`
2. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
3. **Paste and Run** the SQL
4. **Verify** by creating a new organization and syncing

## Prevention Checklist

When adding new tables with RLS:

- [ ] **INSERT policy**: Allow authenticated users to create
- [ ] **UPDATE policy**: Allow admins OR recent creations (30s window)
- [ ] **SELECT policy**: Allow members to view their org's data
- [ ] **Triggers**: Make them idempotent (check before insert)
- [ ] **Test sync flow**: Create locally → sync → verify no RLS errors

## Related Files

- `/supabase/migrations/00001_complete_schema.sql` - Original schema
- `/supabase/migrations/00003_fix_org_sync_rls.sql` - Trigger fix
- `/supabase/migrations/00004_fix_org_insert_rls.sql` - Policy fix
- `/app/services/sync.ts` - WatermelonDB sync implementation
- `/app/context/DatabaseContext.tsx` - Organization creation logic

## When This Happens Again

1. **Check if SQL was applied**: Run this in Supabase SQL Editor:
   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'organizations';
   ```

2. **Look for the 30-second grace period** in UPDATE policy:
   - Should see `created_at > NOW() - '00:00:30'::interval`

3. **If not present**: Re-apply migration 00004

4. **If still failing**: Check if trigger is creating conflicts:
   ```sql
   SELECT * FROM memberships
   WHERE organization_id = 'YOUR_ORG_ID';
   ```

## Why This Is Tricky

1. **Local-first + RLS**: RLS assumes server creates IDs, but local-first creates them client-side
2. **Upsert semantics**: Even "INSERT" operations check UPDATE policies as a safety measure
3. **Async triggers**: Trigger runs after INSERT, but membership might already exist from sync
4. **Testing difficulty**: Only fails during actual sync, not in local development

## Key Takeaway

**When using local-first databases with Supabase RLS, always include a time-based grace period in UPDATE policies to allow sync operations to complete before membership-based checks kick in.**

This pattern should be applied to ALL tables that:
- Are created locally first
- Have membership-based RLS policies
- Get synced via upsert operations
