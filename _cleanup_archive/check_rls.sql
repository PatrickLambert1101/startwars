-- Check if RLS is enabled on organizations table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'memberships', 'invites');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('organizations', 'memberships', 'invites')
ORDER BY tablename, policyname;
