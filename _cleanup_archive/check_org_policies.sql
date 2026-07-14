-- Get the full definition of the SELECT policy
SELECT pg_get_policydef(oid) as policy_definition
FROM pg_policy
WHERE polname = 'Members can view organizations'
AND polrelid = 'organizations'::regclass;

-- Check if you have any memberships that would let you see orgs
SELECT m.organization_id, m.role, o.name as org_name
FROM memberships m
LEFT JOIN organizations o ON o.id = m.organization_id
WHERE m.user_id = auth.uid();

-- Try to select organizations directly (will be filtered by RLS)
SELECT id, name, created_at
FROM organizations
WHERE id = 'w0zkHwYSSZAUE2TF';

-- Disable RLS temporarily on organizations to check if org exists
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

SELECT id, name, created_at
FROM organizations
WHERE id = 'w0zkHwYSSZAUE2TF';

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
