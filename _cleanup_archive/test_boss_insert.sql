-- Test inserting Boss I with the exact data being sent
INSERT INTO organizations (
  id,
  name,
  livestock_types,
  location,
  default_breeds,
  subscription_tier,
  subscription_status,
  subscription_starts_at,
  subscription_ends_at,
  created_at,
  updated_at,
  is_deleted
) VALUES (
  'ECWM4TXJD6JFvQcr',
  'Boss I',
  '["cattle"]'::jsonb,
  'Limpo',
  '{"cattle":"Hereford"}'::jsonb,
  'starter',
  'active',
  NULL,
  NULL,
  to_timestamp(1773594256654 / 1000.0),
  to_timestamp(1773595561400 / 1000.0),
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- Verify
SELECT id, name FROM organizations WHERE id = 'ECWM4TXJD6JFvQcr';
