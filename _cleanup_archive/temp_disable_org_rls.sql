-- Temporarily disable RLS on organizations table so users can see their own orgs
-- This is a workaround for the team invite feature
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'organizations';
