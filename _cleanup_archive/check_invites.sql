-- Check if invites exist and what the structure looks like
SELECT
  id,
  organization_id,
  email,
  role,
  invited_by,
  invite_code,
  created_at
FROM invites
ORDER BY created_at DESC
LIMIT 5;

-- Check if we can join with organizations
SELECT
  i.id,
  i.email,
  i.invite_code,
  o.name as org_name,
  i.invited_by
FROM invites i
LEFT JOIN organizations o ON i.organization_id = o.id
ORDER BY i.created_at DESC
LIMIT 3;

-- Check memberships for the inviter
SELECT
  id,
  organization_id,
  user_id,
  user_email,
  user_display_name,
  role
FROM memberships
WHERE organization_id = 'ECWM4TXJD6JFvQcr'
LIMIT 5;
