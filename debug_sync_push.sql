-- Enable more detailed logging
SET client_min_messages TO NOTICE;

-- Test inserting the organization directly (bypass sync_push)
-- This will show us the actual error
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
  'SUscZwZWRLLBTRrg',
  'Bos',
  '["cattle"]'::jsonb,
  'Veld',
  '{"cattle":"Nguni"}'::jsonb,
  'starter',
  'active',
  NULL,
  NULL,
  to_timestamp(1773589712140 / 1000.0),
  to_timestamp(1773589712140 / 1000.0),
  false
);

-- Check if it was inserted
SELECT id, name FROM organizations WHERE id = 'SUscZwZWRLLBTRrg';
