-- TEMPORARY: Disable RLS on invites table for testing
-- This allows anyone authenticated to create invites
-- You should re-enable proper RLS once team features are working

ALTER TABLE invites DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'invites';
