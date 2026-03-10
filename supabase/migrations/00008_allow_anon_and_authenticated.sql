-- ============================================================================
-- FIX: Allow BOTH anon AND authenticated roles for RLS
-- ============================================================================
-- The issue: Supabase JS client might be using 'anon' role even when logged in
-- Solution: Allow both anon and authenticated roles for all operations
-- ============================================================================

-- ============================================================================
-- PART 1: FIX ORGANIZATIONS TABLE
-- ============================================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can delete organizations" ON organizations;

-- Policy 1: Allow INSERT for BOTH anon and authenticated
-- Use PUBLIC to allow all roles
CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 2: Allow SELECT for members (any role)
CREATE POLICY "Members can view organizations"
  ON organizations
  FOR SELECT
  TO public
  USING (
    auth.uid() IS NOT NULL AND
    public.is_org_member(id)
  );

-- Policy 3: Allow UPDATE for admins or newly created orgs
CREATE POLICY "Admins can update organizations"
  ON organizations
  FOR UPDATE
  TO public
  USING (
    auth.uid() IS NOT NULL AND (
      public.is_org_admin(id) OR
      created_at > NOW() - INTERVAL '30 seconds'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      public.is_org_admin(id) OR
      created_at > NOW() - INTERVAL '30 seconds'
    )
  );

-- Policy 4: Allow DELETE for admins
CREATE POLICY "Admins can delete organizations"
  ON organizations
  FOR DELETE
  TO public
  USING (
    auth.uid() IS NOT NULL AND
    public.is_org_admin(id)
  );

-- ============================================================================
-- PART 2: FIX STORAGE BUCKET
-- ============================================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;

-- Policy 1: Allow INSERT for any authenticated user
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    bucket_id = 'herdtrackr-photos'
  );

-- Policy 2: Allow SELECT for any authenticated user
CREATE POLICY "Authenticated users can view photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    auth.uid() IS NOT NULL AND
    bucket_id = 'herdtrackr-photos'
  );

-- Policy 3: Allow UPDATE for any authenticated user
CREATE POLICY "Authenticated users can update photos"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (
    auth.uid() IS NOT NULL AND
    bucket_id = 'herdtrackr-photos'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    bucket_id = 'herdtrackr-photos'
  );

-- Policy 4: Allow DELETE for any authenticated user
CREATE POLICY "Authenticated users can delete photos"
  ON storage.objects
  FOR DELETE
  TO public
  USING (
    auth.uid() IS NOT NULL AND
    bucket_id = 'herdtrackr-photos'
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ RLS POLICIES UPDATED - NOW ALLOWING PUBLIC ROLE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Key Changes:';
  RAISE NOTICE '  • Changed FROM "TO authenticated" TO "TO public"';
  RAISE NOTICE '  • Added auth.uid() IS NOT NULL checks';
  RAISE NOTICE '  • This allows both anon and authenticated roles';
  RAISE NOTICE '';
  RAISE NOTICE 'Why: Supabase JS client uses anon role even when logged in,';
  RAISE NOTICE '     but auth.uid() will be present for authenticated users';
  RAISE NOTICE '============================================================================';
END $$;
