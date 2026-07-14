-- ============================================================================
-- Migration: Add is_deleted column to memberships table
-- ============================================================================
-- The memberships table was missing the is_deleted column, which caused
-- sync_pull to skip it. This migration adds the column.
-- ============================================================================

-- Add is_deleted column to memberships table
ALTER TABLE memberships
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_memberships_is_deleted ON memberships(is_deleted);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ ADDED is_deleted COLUMN TO MEMBERSHIPS TABLE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Added is_deleted column with default FALSE';
  RAISE NOTICE '✓ Created index on is_deleted for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Memberships table now matches other tables for sync consistency';
  RAISE NOTICE '============================================================================';
END $$;
