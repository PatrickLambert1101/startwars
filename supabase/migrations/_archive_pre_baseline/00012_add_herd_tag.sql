-- Add herd_tag column to animals table
-- Allows grouping animals with custom tags like "23-C", "XYZ", etc.

ALTER TABLE animals
ADD COLUMN IF NOT EXISTS herd_tag TEXT;

-- Create index for herd_tag queries
CREATE INDEX IF NOT EXISTS idx_animals_herd_tag ON animals(herd_tag);

-- Update existing sync_pull function to include herd_tag
CREATE OR REPLACE FUNCTION public.sync_pull(last_pulled_at BIGINT DEFAULT 0)
RETURNS JSONB AS $$
DECLARE
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
  table_name TEXT;
  result JSONB := '{}';
  changes JSONB;
  deletions JSONB;
  timestamp_ms BIGINT;
BEGIN
  timestamp_ms := FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000);

  FOREACH table_name IN ARRAY tables
  LOOP
    EXECUTE format('
      SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
      FROM (
        SELECT * FROM %I
        WHERE EXTRACT(EPOCH FROM updated_at) * 1000 > $1
          AND is_deleted = FALSE
          AND public.is_org_member(organization_id)
        ORDER BY updated_at ASC
      ) t
    ', table_name) INTO changes USING last_pulled_at;

    EXECUTE format('
      SELECT COALESCE(jsonb_agg(id), ''[]''::jsonb)
      FROM (
        SELECT id FROM %I
        WHERE EXTRACT(EPOCH FROM updated_at) * 1000 > $1
          AND is_deleted = TRUE
          AND public.is_org_member(organization_id)
      ) t
    ', table_name) INTO deletions USING last_pulled_at;

    result := jsonb_set(
      result,
      ARRAY[table_name],
      jsonb_build_object(
        'created', changes,
        'updated', '[]'::jsonb,
        'deleted', deletions
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'changes', result,
    'timestamp', timestamp_ms
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
