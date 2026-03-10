-- Fix RLS policy to allow inserting organizations during sync
-- The issue: upsert requires both INSERT and UPDATE policies to work
-- When syncing a new org, Supabase might check UPDATE policy even for new records

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;

-- Recreate with better logic
-- 1. Allow authenticated users to INSERT new organizations (trigger will add membership)
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Allow viewing orgs you're a member of
CREATE POLICY "Members can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (public.is_org_member(id));

-- 3. Allow updating orgs you're an admin of OR that were just created (for sync)
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
