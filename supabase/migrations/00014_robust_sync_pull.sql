-- ============================================================================
-- Robust Sync Pull: Handle missing tables/columns gracefully
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
  -- Include ALL tables that need to sync
  tables TEXT[] := ARRAY[
    'organizations',
    'memberships',
    'pastures',
    'animals',
    'health_records',
    'weight_records',
    'breeding_records',
    'treatment_protocols',
    'pasture_movements'
  ];
BEGIN
  timestamp_now := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := epoch_to_timestamp(last_pulled_at);

  -- Process each table
  FOREACH table_name IN ARRAY tables LOOP
    BEGIN
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

    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but continue with other tables
        RAISE WARNING 'Error syncing table %: % (SQLSTATE: %)', table_name, SQLERRM, SQLSTATE;

        -- Return empty changeset for this table
        table_changes := jsonb_build_object(
          'created', '[]'::jsonb,
          'updated', '[]'::jsonb,
          'deleted', '[]'::jsonb
        );
        changes := changes || jsonb_build_object(table_name, table_changes);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'changes', changes,
    'timestamp', timestamp_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ SYNC_PULL FUNCTION UPDATED WITH ERROR HANDLING';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  Robustness improvements:';
  RAISE NOTICE '  • Wrapped each table sync in try-catch block';
  RAISE NOTICE '  • Continues syncing even if one table fails';
  RAISE NOTICE '  • Logs warnings for debugging';
  RAISE NOTICE '  • Returns empty changeset for failed tables';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables included:';
  RAISE NOTICE '  1. organizations';
  RAISE NOTICE '  2. memberships';
  RAISE NOTICE '  3. pastures';
  RAISE NOTICE '  4. animals';
  RAISE NOTICE '  5. health_records';
  RAISE NOTICE '  6. weight_records';
  RAISE NOTICE '  7. breeding_records';
  RAISE NOTICE '  8. treatment_protocols';
  RAISE NOTICE '  9. pasture_movements';
  RAISE NOTICE '============================================================================';
END $$;
