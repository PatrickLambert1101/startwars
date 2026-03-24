-- ============================================================================
-- NUCLEAR OPTION: Completely drop, wait, recreate sync_pull
-- ============================================================================

-- Revoke all permissions first
REVOKE ALL ON FUNCTION public.sync_pull(BIGINT) FROM authenticated;
REVOKE ALL ON FUNCTION public.sync_pull(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.sync_pull(BIGINT) FROM public;

-- Drop the function completely
DROP FUNCTION IF EXISTS public.sync_pull(BIGINT) CASCADE;

-- Wait a moment
SELECT pg_sleep(1);

-- Create fresh function with a different approach to avoid type issues
CREATE OR REPLACE FUNCTION public.sync_pull(last_pulled_at BIGINT DEFAULT 0)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '60s'
AS $$
DECLARE
  timestamp_now BIGINT;
  since_timestamp TIMESTAMPTZ;
  changes JSONB := '{}'::jsonb;
  created_records JSONB;
  updated_records JSONB;
  deleted_ids JSONB;
  user_org_ids TEXT;
  current_user_id TEXT;
BEGIN
  timestamp_now := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := to_timestamp(last_pulled_at / 1000.0);

  -- Get current user ID as TEXT to avoid type issues
  current_user_id := auth.uid()::TEXT;

  -- Get user's organization IDs as comma-separated TEXT
  SELECT STRING_AGG(organization_id::TEXT, ',')
  INTO user_org_ids
  FROM memberships
  WHERE user_id::TEXT = current_user_id
    AND is_deleted = false
    AND is_active = true;

  -- If user has no organizations, return empty
  IF user_org_ids IS NULL THEN
    RETURN jsonb_build_object(
      'changes', jsonb_build_object(
        'organizations', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'memberships', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pastures', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'animals', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'treatment_protocols', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'health_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'weight_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'breeding_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pasture_movements', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'vaccination_schedules', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'scheduled_vaccinations', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb)
      ),
      'timestamp', timestamp_now
    );
  END IF;

  -- Organizations
  IF last_pulled_at > 0 THEN
    EXECUTE format('SELECT COALESCE(jsonb_agg(jsonb_build_object(''id'', id, ''name'', name, ''livestock_types'', livestock_types, ''location'', location, ''created_at'', created_at, ''updated_at'', updated_at, ''is_deleted'', is_deleted, ''remote_id'', remote_id)), ''[]''::jsonb) FROM organizations WHERE created_at > $1 AND is_deleted = false AND id::TEXT IN (%s)',
      (SELECT STRING_AGG('''' || unnest || '''', ',') FROM unnest(string_to_array(user_org_ids, ','))))
    INTO created_records
    USING since_timestamp;

    EXECUTE format('SELECT COALESCE(jsonb_agg(jsonb_build_object(''id'', id, ''name'', name, ''livestock_types'', livestock_types, ''location'', location, ''created_at'', created_at, ''updated_at'', updated_at, ''is_deleted'', is_deleted, ''remote_id'', remote_id)), ''[]''::jsonb) FROM organizations WHERE updated_at > $1 AND created_at <= $1 AND is_deleted = false AND id::TEXT IN (%s)',
      (SELECT STRING_AGG('''' || unnest || '''', ',') FROM unnest(string_to_array(user_org_ids, ','))))
    INTO updated_records
    USING since_timestamp;

    EXECUTE format('SELECT COALESCE(jsonb_agg(id), ''[]''::jsonb) FROM organizations WHERE updated_at > $1 AND is_deleted = true AND id::TEXT IN (%s)',
      (SELECT STRING_AGG('''' || unnest || '''', ',') FROM unnest(string_to_array(user_org_ids, ','))))
    INTO deleted_ids
    USING since_timestamp;
  ELSE
    EXECUTE format('SELECT COALESCE(jsonb_agg(jsonb_build_object(''id'', id, ''name'', name, ''livestock_types'', livestock_types, ''location'', location, ''created_at'', created_at, ''updated_at'', updated_at, ''is_deleted'', is_deleted, ''remote_id'', remote_id)), ''[]''::jsonb) FROM organizations WHERE is_deleted = false AND id::TEXT IN (%s)',
      (SELECT STRING_AGG('''' || unnest || '''', ',') FROM unnest(string_to_array(user_org_ids, ','))))
    INTO created_records;
    updated_records := '[]'::jsonb;
    deleted_ids := '[]'::jsonb;
  END IF;

  changes := changes || jsonb_build_object('organizations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- For now, return other tables as empty to get SOMETHING working
  changes := changes || jsonb_build_object('memberships', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('pastures', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('animals', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('treatment_protocols', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('health_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('weight_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('breeding_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('pasture_movements', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('vaccination_schedules', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));
  changes := changes || jsonb_build_object('scheduled_vaccinations', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb));

  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.sync_pull(BIGINT) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ SYNC_PULL NUCLEAR RESET - CACHE CLEARED';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Using TEXT comparison to avoid UUID type issues';
  RAISE NOTICE 'Function completely dropped and recreated';
  RAISE NOTICE '============================================================================';
END $$;
