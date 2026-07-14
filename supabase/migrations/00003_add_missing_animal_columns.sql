-- Add missing columns to animals table if they don't exist
DO $$
BEGIN
  -- Add genetic_traits column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'animals' AND column_name = 'genetic_traits'
  ) THEN
    ALTER TABLE animals ADD COLUMN genetic_traits JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'animals' AND column_name = 'tags'
  ) THEN
    ALTER TABLE animals ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add herd_tag column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'animals' AND column_name = 'herd_tag'
  ) THEN
    ALTER TABLE animals ADD COLUMN herd_tag TEXT;
  END IF;

  -- Create index on herd_tag if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_animals_herd_tag'
  ) THEN
    CREATE INDEX idx_animals_herd_tag ON animals(herd_tag);
  END IF;
END $$;
