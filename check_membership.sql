-- Check if your membership exists in Supabase
SELECT
  m.id,
  m.user_id,
  m.user_email,
  m.role,
  m.organization_id,
  o.name as org_name
FROM memberships m
LEFT JOIN organizations o ON o.id = m.organization_id
WHERE m.user_email LIKE '%lambertpatrick09%'
ORDER BY m.created_at DESC
LIMIT 10;

-- Check your user ID
SELECT auth.uid() as my_user_id;

-- Test the RLS policy for a specific org
-- Replace 'w0zkHwYSSZAUE2TF' with your actual org ID if different
SELECT
  organization_id,
  user_id,
  role
FROM memberships
WHERE organization_id = 'w0zkHwYSSZAUE2TF'
AND user_id = auth.uid()
AND role = 'admin';
