-- Debug: Test sync_pull for memberships table specifically
-- This helps diagnose why memberships aren't showing up

DO $$
DECLARE
  created_records JSONB;
BEGIN
  -- Test the exact query that sync_pull uses for first pull
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO created_records
  FROM memberships t
  WHERE t.is_deleted = false;

  RAISE NOTICE 'Memberships found: %', jsonb_array_length(created_records);
  RAISE NOTICE 'Sample: %', created_records->0;
END $$;
