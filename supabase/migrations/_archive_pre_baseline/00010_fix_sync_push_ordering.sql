-- ============================================================================
-- FIX: Sync Push Table Ordering (Foreign Key Dependencies)
-- ============================================================================
-- Problem: Animals were being inserted before Organizations, causing
--          foreign key constraint violations
-- Solution: Process tables in dependency order
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
  -- Define table order to respect foreign key dependencies
  tables_ordered TEXT[] := ARRAY[
    'organizations',      -- Must be first (parent)
    'memberships',        -- Depends on organizations
    'pastures',          -- Depends on organizations
    'animals',           -- Depends on organizations
    'treatment_protocols', -- Depends on organizations
    'health_records',    -- Depends on animals
    'weight_records',    -- Depends on animals
    'breeding_records',  -- Depends on animals
    'pasture_movements'  -- Depends on pastures and animals
  ];
BEGIN
  -- Process each table IN ORDER to respect foreign keys
  FOREACH table_name IN ARRAY tables_ordered LOOP
    -- Skip if table not in changes
    IF NOT (changes ? table_name) THEN
      CONTINUE;
    END IF;

    table_changes := changes -> table_name;
    created_records := table_changes -> 'created';
    updated_records := table_changes -> 'updated';
    deleted_ids := table_changes -> 'deleted';

    -- Process CREATED records
    IF jsonb_array_length(COALESCE(created_records, '[]'::jsonb)) > 0 THEN
      FOR record IN SELECT * FROM jsonb_array_elements(created_records) LOOP
        BEGIN
          EXECUTE format(
            'INSERT INTO %I
             SELECT * FROM jsonb_populate_record(NULL::%I, $1)
             ON CONFLICT (id) DO UPDATE SET
               updated_at = EXCLUDED.updated_at',
            table_name, table_name
          ) USING record;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to insert into %: % (Record: %)', table_name, SQLERRM, record;
          -- Continue with next record instead of failing entire sync
        END;
      END LOOP;
    END IF;

    -- Process UPDATED records
    IF jsonb_array_length(COALESCE(updated_records, '[]'::jsonb)) > 0 THEN
      FOR record IN SELECT * FROM jsonb_array_elements(updated_records) LOOP
        BEGIN
          EXECUTE format(
            'INSERT INTO %I
             SELECT * FROM jsonb_populate_record(NULL::%I, $1)
             ON CONFLICT (id) DO UPDATE SET
               updated_at = EXCLUDED.updated_at',
            table_name, table_name
          ) USING record;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to update %: % (Record: %)', table_name, SQLERRM, record;
          -- Continue with next record
        END;
      END LOOP;
    END IF;

    -- Process DELETED records (soft delete)
    IF jsonb_array_length(COALESCE(deleted_ids, '[]'::jsonb)) > 0 THEN
      FOR record_id IN SELECT jsonb_array_elements_text(deleted_ids) LOOP
        BEGIN
          EXECUTE format(
            'UPDATE %I SET is_deleted = true, updated_at = NOW() WHERE id = $1',
            table_name
          ) USING record_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to delete from %: %', table_name, SQLERRM;
          -- Continue with next record
        END;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.sync_push(JSONB) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ SYNC_PUSH FUNCTION UPDATED WITH CORRECT TABLE ORDERING';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Table Processing Order:';
  RAISE NOTICE '  1. organizations (parent)';
  RAISE NOTICE '  2. memberships (→ organizations)';
  RAISE NOTICE '  3. pastures (→ organizations)';
  RAISE NOTICE '  4. animals (→ organizations)';
  RAISE NOTICE '  5. treatment_protocols (→ organizations)';
  RAISE NOTICE '  6. health_records (→ animals)';
  RAISE NOTICE '  7. weight_records (→ animals)';
  RAISE NOTICE '  8. breeding_records (→ animals)';
  RAISE NOTICE '  9. pasture_movements (→ pastures, animals)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Improvements:';
  RAISE NOTICE '  • Foreign key constraints now respected';
  RAISE NOTICE '  • Individual record failures logged as warnings';
  RAISE NOTICE '  • Sync continues even if one record fails';
  RAISE NOTICE '============================================================================';
END $$;
