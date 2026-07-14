-- Check what columns exist in organizations table in Supabase
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- Compare with what we're trying to insert
-- This shows what columns are MISSING from Supabase
SELECT
  'default_breeds' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'default_breeds'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
  'subscription_tier',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_tier'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
  'subscription_status',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_status'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
  'subscription_starts_at',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_starts_at'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
  'subscription_ends_at',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_ends_at'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;
