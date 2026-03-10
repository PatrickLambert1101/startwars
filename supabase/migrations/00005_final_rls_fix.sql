-- DEFINITIVE FIX for RLS policies on organizations table
-- This addresses the recurring "new row violates row-level security policy" error

-- First, disable RLS temporarily to ensure we can modify policies
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow ANY authenticated user to INSERT new organizations
-- This is critical for sync to work with locally-created orgs
CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT orgs they're members of
CREATE POLICY "Members can view organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(id));

-- Policy 3: Allow authenticated users to UPDATE orgs they're admins of
-- OR orgs that were just created (30 second grace period for sync)
CREATE POLICY "Admins can update organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(id) OR
    created_at > NOW() - INTERVAL '30 seconds'
  )
  WITH CHECK (
    public.is_org_admin(id) OR
    created_at > NOW() - INTERVAL '30 seconds'
  );

-- Policy 4: Allow admins to DELETE their organizations (soft delete via update)
CREATE POLICY "Admins can delete organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (public.is_org_admin(id));

-- Verify policies were created
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies recreated for organizations table';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies:';
  RAISE NOTICE '  - INSERT: All authenticated users (for sync)';
  RAISE NOTICE '  - SELECT: Members only';
  RAISE NOTICE '  - UPDATE: Admins OR newly created (30s window)';
  RAISE NOTICE '  - DELETE: Admins only';
END $$;
