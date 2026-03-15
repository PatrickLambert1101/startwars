-- Manually insert the Bosveld organization
-- This is a temporary workaround until we fix the sync issue

INSERT INTO organizations (
  id,
  name,
  livestock_types,
  location,
  subscription_tier,
  subscription_status,
  subscription_starts_at,
  subscription_ends_at,
  created_at,
  updated_at,
  is_deleted
) VALUES (
  'w0zkHwYSSZAUE2TF',
  'Bosveld',
  '["cattle"]',
  'Limpopo',
  'starter',
  'active',
  NULL,
  NULL,
  NOW(),
  NOW(),
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- Verify it was inserted
SELECT id, name, created_at
FROM organizations
WHERE id = 'w0zkHwYSSZAUE2TF';

-- Also insert the membership so RLS policies work
INSERT INTO memberships (
  id,
  organization_id,
  user_id,
  user_email,
  user_display_name,
  role,
  invited_by,
  invited_at,
  joined_at,
  created_at,
  updated_at
) VALUES (
  'xNCf18eix6z6ZBZ3',
  'w0zkHwYSSZAUE2TF',
  '67c012a0-393a-473c-90ca-a0b7d027832c',
  'lambertpatrick09+pop@gmail.com',
  'Patrick',
  'admin',
  NULL,
  NULL,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Verify membership was inserted
SELECT id, user_email, role, organization_id
FROM memberships
WHERE organization_id = 'w0zkHwYSSZAUE2TF';
