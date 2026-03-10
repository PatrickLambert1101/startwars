-- Fix RLS policies for photo storage bucket
-- This fixes "new row violates row-level security policy" when uploading photos

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;

-- Policy 1: Allow authenticated users to INSERT (upload) objects to herdtrackr-photos bucket
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'herdtrackr-photos'
  );

-- Policy 2: Allow authenticated users to SELECT (view) objects from herdtrackr-photos bucket
CREATE POLICY "Authenticated users can view photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'herdtrackr-photos'
  );

-- Policy 3: Allow authenticated users to UPDATE objects in herdtrackr-photos bucket
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

-- Policy 4: Allow authenticated users to DELETE objects from herdtrackr-photos bucket
CREATE POLICY "Authenticated users can delete photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'herdtrackr-photos'
  );

-- Verify policies were created
DO $$
BEGIN
  RAISE NOTICE '✅ Storage RLS policies created for herdtrackr-photos bucket';
  RAISE NOTICE '';
  RAISE NOTICE 'All authenticated users can:';
  RAISE NOTICE '  - Upload photos';
  RAISE NOTICE '  - View photos';
  RAISE NOTICE '  - Update photos';
  RAISE NOTICE '  - Delete photos';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: Consider restricting to org members in production';
END $$;
