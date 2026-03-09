-- Add is_deleted column to memberships table for soft delete support

ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_memberships_deleted ON memberships(is_deleted);

DO $$
BEGIN
  RAISE NOTICE '✅ Added is_deleted column to memberships table';
END $$;
