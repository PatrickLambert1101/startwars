-- Add tags column to animals table
ALTER TABLE animals ADD COLUMN IF NOT EXISTS tags TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN animals.tags IS 'JSON array of tag strings for categorizing/filtering animals';
