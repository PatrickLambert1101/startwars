-- Check RLS on organizations table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'organizations';

-- Check policies on organizations
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'organizations';

-- Try to find the Bosveld org without RLS (as superuser/service role)
-- This bypasses RLS to see if the org actually exists
SELECT id, name, created_at, is_deleted
FROM organizations
WHERE name = 'Bosveld'
ORDER BY created_at DESC
LIMIT 5;

-- Check for any org with ID starting with 'w0zkH'
SELECT id, name, created_at, is_deleted
FROM organizations
WHERE id LIKE 'w0zkH%'
LIMIT 5;

-- Check all recent organizations
SELECT id, name, created_at, is_deleted
FROM organizations
ORDER BY created_at DESC
LIMIT 10;
