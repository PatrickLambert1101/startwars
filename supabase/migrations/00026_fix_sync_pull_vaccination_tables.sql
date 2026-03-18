-- ============================================================================
-- FIX: Sync Pull to handle tables without is_deleted column
-- ============================================================================
-- Issue: vaccination_schedules and scheduled_vaccinations don't have is_deleted
-- Solution: Check if column exists before using it in queries

CREATE OR REPLACE FUNCTION public.sync_pull(last_pulled_at BIGINT DEFAULT 0)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  timestamp_now BIGINT;
  since_timestamp TIMESTAMPTZ;
  changes JSONB := '{}'::jsonb;
  tbl_name TEXT;
  table_changes JSONB;
  created_records JSONB;
  updated_records JSONB;
  deleted_ids JSONB;
  has_is_deleted BOOLEAN;
  tables TEXT[] := ARRAY[
    'organizations',
    'memberships',
    'pastures',
    'pasture_movements',
    'animals',
    'health_records',
    'weight_records',
    'breeding_records',
    'treatment_protocols',
    'vaccination_schedules',
    'scheduled_vaccinations'
  ];
BEGIN
  timestamp_now := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := to_timestamp(last_pulled_at / 1000.0);

  FOREACH tbl_name IN ARRAY tables LOOP
    -- Check if table has is_deleted column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = tbl_name
        AND c.column_name = 'is_deleted'
    ) INTO has_is_deleted;

    IF last_pulled_at > 0 THEN
      IF has_is_deleted THEN
        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
           FROM %I t
           WHERE t.created_at > $1 AND t.is_deleted = false',
          tbl_name
        ) INTO created_records USING since_timestamp;

        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
           FROM %I t
           WHERE t.updated_at > $1 AND t.created_at <= $1 AND t.is_deleted = false',
          tbl_name
        ) INTO updated_records USING since_timestamp;

        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(t.id), ''[]''::jsonb)
           FROM %I t
           WHERE t.updated_at > $1 AND t.is_deleted = true',
          tbl_name
        ) INTO deleted_ids USING since_timestamp;
      ELSE
        -- Table doesn't have is_deleted, just sync everything
        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
           FROM %I t
           WHERE t.created_at > $1',
          tbl_name
        ) INTO created_records USING since_timestamp;

        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
           FROM %I t
           WHERE t.updated_at > $1 AND t.created_at <= $1',
          tbl_name
        ) INTO updated_records USING since_timestamp;

        deleted_ids := '[]'::jsonb;
      END IF;
    ELSE
      -- First sync: pull everything
      IF has_is_deleted THEN
        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
           FROM %I t
           WHERE t.is_deleted = false',
          tbl_name
        ) INTO created_records;
      ELSE
        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
           FROM %I t',
          tbl_name
        ) INTO created_records;
      END IF;

      updated_records := '[]'::jsonb;
      deleted_ids := '[]'::jsonb;
    END IF;

    table_changes := jsonb_build_object(
      'created', created_records,
      'updated', updated_records,
      'deleted', deleted_ids
    );

    changes := changes || jsonb_build_object(tbl_name, table_changes);
  END LOOP;

  RETURN jsonb_build_object(
    'changes', changes,
    'timestamp', timestamp_now
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ SYNC_PULL FUNCTION UPDATED';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Added vaccination_schedules and scheduled_vaccinations tables';
  RAISE NOTICE '✓ Added dynamic is_deleted column check';
  RAISE NOTICE '✓ Fixed timestamp conversion to use to_timestamp()';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
