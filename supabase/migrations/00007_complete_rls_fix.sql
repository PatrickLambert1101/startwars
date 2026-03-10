-- ============================================================================
-- COMPLETE RLS FIX - Run this entire file to fix all RLS issues
-- ============================================================================
-- This fixes:
--   1. "new row violates row-level security policy" on organizations table
--   2. "new row violates row-level security policy" on photo uploads
-- ============================================================================

-- ============================================================================
-- PART 1: FIX ORGANIZATIONS TABLE RLS
-- ============================================================================

-- Temporarily disable RLS to modify policies
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can delete organizations" ON organizations;

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow ANY authenticated user to INSERT new organizations
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

-- Policy 3: Allow authenticated users to UPDATE orgs they're admins of OR just created
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

-- Policy 4: Allow admins to DELETE their organizations
CREATE POLICY "Admins can delete organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (public.is_org_admin(id));

-- ============================================================================
-- PART 2: FIX STORAGE BUCKET RLS
-- ============================================================================

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;

-- Policy 1: Allow authenticated users to INSERT (upload) photos
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'herdtrackr-photos'
  );

-- Policy 2: Allow authenticated users to SELECT (view) photos
CREATE POLICY "Authenticated users can view photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'herdtrackr-photos'
  );

-- Policy 3: Allow authenticated users to UPDATE photos
CREATE POLICY "Authenticated users can update photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'herdtrackr-photos'
  )
  WITH CHECK (
    bucket_id = 'herdtrackr-photos'
  );

-- Policy 4: Allow authenticated users to DELETE photos
CREATE POLICY "Authenticated users can delete photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'herdtrackr-photos'
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ ALL RLS POLICIES FIXED SUCCESSFULLY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Organizations Table Policies:';
  RAISE NOTICE '  ✓ INSERT: All authenticated users (for local-first sync)';
  RAISE NOTICE '  ✓ SELECT: Members only';
  RAISE NOTICE '  ✓ UPDATE: Admins OR newly created (30s grace period)';
  RAISE NOTICE '  ✓ DELETE: Admins only';
  RAISE NOTICE '';
  RAISE NOTICE '📸 Storage Bucket Policies (herdtrackr-photos):';
  RAISE NOTICE '  ✓ INSERT: All authenticated users';
  RAISE NOTICE '  ✓ SELECT: All authenticated users';
  RAISE NOTICE '  ✓ UPDATE: All authenticated users';
  RAISE NOTICE '  ✓ DELETE: All authenticated users';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 You can now:';
  RAISE NOTICE '  • Create organizations locally and sync them';
  RAISE NOTICE '  • Upload photos to animals/records';
  RAISE NOTICE '  • Switch between multiple organizations';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Production Note:';
  RAISE NOTICE '  Consider restricting storage policies to org members';
  RAISE NOTICE '============================================================================';
END $$;
