-- Modify sync_push to return actual error details instead of just warnings
-- This will help us see what's failing

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
  error_count INT := 0;
  errors JSONB := '[]'::jsonb;
  tables_ordered TEXT[] := ARRAY[
    'organizations',
    'memberships',
    'pastures',
    'animals',
    'treatment_protocols',
    'health_records',
    'weight_records',
    'breeding_records',
    'pasture_movements'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_ordered LOOP
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
          error_count := error_count + 1;
          errors := errors || jsonb_build_object(
            'table', table_name,
            'operation', 'create',
            'record_id', record->>'id',
            'error', SQLERRM
          );
          RAISE WARNING 'Failed to insert into %: % (Record: %)', table_name, SQLERRM, record;
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
          error_count := error_count + 1;
          errors := errors || jsonb_build_object(
            'table', table_name,
            'operation', 'update',
            'record_id', record->>'id',
            'error', SQLERRM
          );
          RAISE WARNING 'Failed to update %: % (Record: %)', table_name, SQLERRM, record;
        END;
      END LOOP;
    END IF;

    -- Process DELETED records
    IF jsonb_array_length(COALESCE(deleted_ids, '[]'::jsonb)) > 0 THEN
      FOR record_id IN SELECT jsonb_array_elements_text(deleted_ids) LOOP
        BEGIN
          EXECUTE format(
            'UPDATE %I SET is_deleted = true, updated_at = NOW() WHERE id = $1',
            table_name
          ) USING record_id;
        EXCEPTION WHEN OTHERS THEN
          error_count := error_count + 1;
          errors := errors || jsonb_build_object(
            'table', table_name,
            'operation', 'delete',
            'record_id', record_id,
            'error', SQLERRM
          );
          RAISE WARNING 'Failed to delete from %: %', table_name, SQLERRM;
        END;
      END LOOP;
    END IF;
  END LOOP;

  IF error_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_count', error_count,
      'errors', errors
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sync_push(JSONB) TO authenticated;
