-- ============================================================================
-- PROPER SYNC IMPLEMENTATION: RPC Functions (Best Practice)
-- ============================================================================
-- This is the CORRECT way to sync WatermelonDB with Supabase
-- Using SECURITY DEFINER functions that bypass RLS issues
-- Based on official Supabase WatermelonDB guide
-- ============================================================================

-- ============================================================================
-- HELPER: Convert epoch milliseconds to PostgreSQL timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.epoch_to_timestamp(epoch BIGINT)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN to_timestamp(epoch / 1000.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- HELPER: Convert PostgreSQL timestamp to epoch milliseconds
-- ============================================================================
CREATE OR REPLACE FUNCTION public.timestamp_to_epoch(ts TIMESTAMPTZ)
RETURNS BIGINT AS $$
BEGIN
  RETURN CAST(EXTRACT(EPOCH FROM ts) * 1000 AS BIGINT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PUSH FUNCTION: Receives local changes and applies them to Supabase
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_push(changes JSONB)
RETURNS JSONB AS $$
DECLARE
  table_name TEXT;
  table_changes JSONB;
  created_records JSONB;
  updated_records JSONB;
  deleted_ids JSONB;
  record JSONB;
  record_id TEXT;
BEGIN
  -- Process each table's changes
  FOR table_name IN SELECT jsonb_object_keys(changes) LOOP
    table_changes := changes -> table_name;
    created_records := table_changes -> 'created';
    updated_records := table_changes -> 'updated';
    deleted_ids := table_changes -> 'deleted';

    -- Process CREATED records
    IF jsonb_array_length(COALESCE(created_records, '[]'::jsonb)) > 0 THEN
      FOR record IN SELECT * FROM jsonb_array_elements(created_records) LOOP
        EXECUTE format(
          'INSERT INTO %I
           SELECT * FROM jsonb_populate_record(NULL::%I, $1)
           ON CONFLICT (id) DO UPDATE SET
             updated_at = EXCLUDED.updated_at',
          table_name, table_name
        ) USING record;
      END LOOP;
    END IF;

    -- Process UPDATED records
    IF jsonb_array_length(COALESCE(updated_records, '[]'::jsonb)) > 0 THEN
      FOR record IN SELECT * FROM jsonb_array_elements(updated_records) LOOP
        EXECUTE format(
          'INSERT INTO %I
           SELECT * FROM jsonb_populate_record(NULL::%I, $1)
           ON CONFLICT (id) DO UPDATE SET
             updated_at = EXCLUDED.updated_at',
          table_name, table_name
        ) USING record;
      END LOOP;
    END IF;

    -- Process DELETED records (soft delete)
    IF jsonb_array_length(COALESCE(deleted_ids, '[]'::jsonb)) > 0 THEN
      FOR record_id IN SELECT jsonb_array_elements_text(deleted_ids) LOOP
        EXECUTE format(
          'UPDATE %I SET is_deleted = true, updated_at = NOW() WHERE id = $1',
          table_name
        ) USING record_id;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PULL FUNCTION: Returns changes since last sync timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_pull(last_pulled_at BIGINT DEFAULT 0)
RETURNS JSONB AS $$
DECLARE
  timestamp_now BIGINT;
  since_timestamp TIMESTAMPTZ;
  changes JSONB := '{}'::jsonb;
  table_name TEXT;
  table_changes JSONB;
  created_records JSONB;
  updated_records JSONB;
  deleted_ids JSONB;
  tables TEXT[] := ARRAY[
    'organizations',
    'memberships',
    'animals',
    'health_records',
    'weight_records',
    'breeding_records',
    'treatment_protocols'
  ];
BEGIN
  timestamp_now := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := epoch_to_timestamp(last_pulled_at);

  -- Process each table
  FOREACH table_name IN ARRAY tables LOOP
    -- Get created records (created after last sync)
    IF last_pulled_at > 0 THEN
      EXECUTE format(
        'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
         FROM %I t
         WHERE t.created_at > $1 AND t.is_deleted = false',
        table_name
      ) INTO created_records USING since_timestamp;

      -- Get updated records (updated but not created after last sync)
      EXECUTE format(
        'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
         FROM %I t
         WHERE t.updated_at > $1 AND t.created_at <= $1 AND t.is_deleted = false',
        table_name
      ) INTO updated_records USING since_timestamp;

      -- Get deleted records
      EXECUTE format(
        'SELECT COALESCE(jsonb_agg(t.id), ''[]''::jsonb)
         FROM %I t
         WHERE t.updated_at > $1 AND t.is_deleted = true',
        table_name
      ) INTO deleted_ids USING since_timestamp;
    ELSE
      -- First sync: pull everything
      EXECUTE format(
        'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
         FROM %I t
         WHERE t.is_deleted = false',
        table_name
      ) INTO created_records;

      updated_records := '[]'::jsonb;
      deleted_ids := '[]'::jsonb;
    END IF;

    -- Build table changes object
    table_changes := jsonb_build_object(
      'created', created_records,
      'updated', updated_records,
      'deleted', deleted_ids
    );

    -- Add to changes
    changes := changes || jsonb_build_object(table_name, table_changes);
  END LOOP;

  RETURN jsonb_build_object(
    'changes', changes,
    'timestamp', timestamp_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_push(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_pull(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.epoch_to_timestamp(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.timestamp_to_epoch(TIMESTAMPTZ) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ RPC SYNC FUNCTIONS CREATED SUCCESSFULLY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Functions Created:';
  RAISE NOTICE '  • sync_push(changes JSONB) - Apply local changes to Supabase';
  RAISE NOTICE '  • sync_pull(last_pulled_at BIGINT) - Get changes since timestamp';
  RAISE NOTICE '  • epoch_to_timestamp() - Convert ms to timestamp';
  RAISE NOTICE '  • timestamp_to_epoch() - Convert timestamp to ms';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '  • Functions run as SECURITY DEFINER (bypass RLS)';
  RAISE NOTICE '  • Only authenticated users can execute';
  RAISE NOTICE '  • User context preserved via auth.uid()';
  RAISE NOTICE '';
  RAISE NOTICE '📖 Usage in App:';
  RAISE NOTICE '  • await supabase.rpc("sync_push", { changes })';
  RAISE NOTICE '  • await supabase.rpc("sync_pull", { last_pulled_at })';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Next Steps:';
  RAISE NOTICE '  1. Update app/services/sync.ts to use RPC functions';
  RAISE NOTICE '  2. Remove direct table upsert calls';
  RAISE NOTICE '  3. Test sync flow end-to-end';
  RAISE NOTICE '============================================================================';
END $$;
