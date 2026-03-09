-- Migration: Add photo support to records and models
-- Version: 8
-- Created: 2026-03-09

-- Add photos column to weight_records
ALTER TABLE weight_records
ADD COLUMN IF NOT EXISTS photos TEXT;

COMMENT ON COLUMN weight_records.photos IS 'JSON array of photo objects with URLs, timestamps, and metadata';

-- Add photos column to health_records
ALTER TABLE health_records
ADD COLUMN IF NOT EXISTS photos TEXT;

COMMENT ON COLUMN health_records.photos IS 'JSON array of photo objects with URLs, timestamps, and metadata';

-- Add photos column to breeding_records
ALTER TABLE breeding_records
ADD COLUMN IF NOT EXISTS photos TEXT;

COMMENT ON COLUMN breeding_records.photos IS 'JSON array of photo objects with URLs, timestamps, and metadata';

-- Add photos column to animals
ALTER TABLE animals
ADD COLUMN IF NOT EXISTS photos TEXT;

COMMENT ON COLUMN animals.photos IS 'JSON array of photo objects for animal identification and documentation';

-- Add photos column to pastures
ALTER TABLE pastures
ADD COLUMN IF NOT EXISTS photos TEXT;

COMMENT ON COLUMN pastures.photos IS 'JSON array of photo objects for pasture condition documentation';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 00008_add_photos completed successfully';
  RAISE NOTICE 'Added photos column to: weight_records, health_records, breeding_records, animals, pastures';
  RAISE NOTICE 'Next step: Create Supabase Storage bucket "herdtrackr-photos" (see PHOTO_STORAGE_SETUP.md)';
END $$;
