-- ---------------------------------------------------------------------------
-- 00013: CSV/XLSX import batches and historical grazing periods (app schema v22)
--
-- Historical grazing is stored separately from live per-animal movements.
-- This keeps an import from changing today's pasture occupancy.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS grazing_periods (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pasture_id TEXT NOT NULL REFERENCES pastures(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  herd_group TEXT,
  animal_count INTEGER CHECK (animal_count IS NULL OR animal_count > 0),
  notes TEXT,
  source_file_name TEXT,
  created_by_user_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created',
  CONSTRAINT grazing_period_dates_valid CHECK (
    end_date IS NULL OR end_date >= start_date
  )
);

CREATE INDEX IF NOT EXISTS idx_grazing_periods_org
  ON grazing_periods(organization_id);
CREATE INDEX IF NOT EXISTS idx_grazing_periods_pasture_start
  ON grazing_periods(pasture_id, start_date DESC);

CREATE TABLE IF NOT EXISTS data_import_batches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL CHECK (import_type IN ('treatments', 'grazing')),
  file_name TEXT NOT NULL,
  sheet_name TEXT,
  total_rows INTEGER NOT NULL CHECK (total_rows >= 0),
  imported_rows INTEGER NOT NULL CHECK (imported_rows >= 0),
  skipped_rows INTEGER NOT NULL CHECK (skipped_rows >= 0),
  record_ids TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('completed', 'undone')),
  imported_at TIMESTAMPTZ NOT NULL,
  undone_at TIMESTAMPTZ,
  created_by_user_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_data_import_batches_org_date
  ON data_import_batches(organization_id, imported_at DESC);

ALTER TABLE grazing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_import_batches ENABLE ROW LEVEL SECURITY;

DO $pol$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'grazing_periods'
       AND policyname = 'grazing_periods_all'
  ) THEN
    CREATE POLICY "grazing_periods_all" ON grazing_periods FOR ALL
      USING (is_org_member(organization_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'data_import_batches'
       AND policyname = 'data_import_batches_all'
  ) THEN
    CREATE POLICY "data_import_batches_all" ON data_import_batches FOR ALL
      USING (is_org_member(organization_id));
  END IF;
END
$pol$;

-- ---- Patch sync_push ------------------------------------------------------

DO $mig$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO def
    FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace
     AND proname = 'sync_push';

  IF def IS NULL THEN
    RAISE EXCEPTION 'sync_push not found';
  END IF;

  IF position('grazing_periods' in def) = 0
     OR position('data_import_batches' in def) = 0 THEN
    def := replace(
      def,
      $anchor$RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);$anchor$,
      $block$-- ---- Grazing Periods ---------------------------------------------------
  IF changes ? 'grazing_periods' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'grazing_periods'->'created', '[]'::jsonb) ||
      COALESCE(changes->'grazing_periods'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO grazing_periods (
          id, organization_id, pasture_id, start_date, end_date,
          herd_group, animal_count, notes, source_file_name,
          created_by_user_id, created_by_name,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'pasture_id',
          (rec->>'start_date')::timestamptz,
          NULLIF(rec->>'end_date', '')::timestamptz,
          rec->>'herd_group',
          NULLIF(rec->>'animal_count', '')::integer,
          rec->>'notes',
          rec->>'source_file_name',
          rec->>'created_by_user_id',
          rec->>'created_by_name',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          pasture_id         = EXCLUDED.pasture_id,
          start_date         = EXCLUDED.start_date,
          end_date           = EXCLUDED.end_date,
          herd_group         = EXCLUDED.herd_group,
          animal_count       = EXCLUDED.animal_count,
          notes              = EXCLUDED.notes,
          source_file_name   = EXCLUDED.source_file_name,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name    = EXCLUDED.created_by_name,
          updated_at         = EXCLUDED.updated_at,
          is_deleted         = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object(
          'table', 'grazing_periods',
          'record_id', rec->>'id',
          'error', SQLERRM
        );
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(
        COALESCE(changes->'grazing_periods'->'deleted', '[]'::jsonb)
      )
    LOOP
      BEGIN
        UPDATE grazing_periods
           SET is_deleted = true, updated_at = NOW()
         WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object(
          'table', 'grazing_periods',
          'record_id', rec_id,
          'error', SQLERRM
        );
      END;
    END LOOP;
  END IF;

  -- ---- Data Import Batches ----------------------------------------------
  IF changes ? 'data_import_batches' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'data_import_batches'->'created', '[]'::jsonb) ||
      COALESCE(changes->'data_import_batches'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO data_import_batches (
          id, organization_id, import_type, file_name, sheet_name,
          total_rows, imported_rows, skipped_rows, record_ids, status,
          imported_at, undone_at, created_by_user_id, created_by_name,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'import_type',
          rec->>'file_name',
          rec->>'sheet_name',
          COALESCE((rec->>'total_rows')::integer, 0),
          COALESCE((rec->>'imported_rows')::integer, 0),
          COALESCE((rec->>'skipped_rows')::integer, 0),
          COALESCE(rec->>'record_ids', '[]'),
          rec->>'status',
          (rec->>'imported_at')::timestamptz,
          NULLIF(rec->>'undone_at', '')::timestamptz,
          rec->>'created_by_user_id',
          rec->>'created_by_name',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          file_name          = EXCLUDED.file_name,
          sheet_name         = EXCLUDED.sheet_name,
          total_rows         = EXCLUDED.total_rows,
          imported_rows      = EXCLUDED.imported_rows,
          skipped_rows       = EXCLUDED.skipped_rows,
          record_ids         = EXCLUDED.record_ids,
          status             = EXCLUDED.status,
          imported_at        = EXCLUDED.imported_at,
          undone_at          = EXCLUDED.undone_at,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name    = EXCLUDED.created_by_name,
          updated_at         = EXCLUDED.updated_at,
          is_deleted         = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object(
          'table', 'data_import_batches',
          'record_id', rec->>'id',
          'error', SQLERRM
        );
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(
        COALESCE(changes->'data_import_batches'->'deleted', '[]'::jsonb)
      )
    LOOP
      BEGIN
        UPDATE data_import_batches
           SET is_deleted = true, updated_at = NOW()
         WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object(
          'table', 'data_import_batches',
          'record_id', rec_id,
          'error', SQLERRM
        );
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);$block$
    );

    IF position('grazing_periods' in def) = 0
       OR position('data_import_batches' in def) = 0 THEN
      RAISE EXCEPTION 'sync_push RETURN anchor not found — patch manually';
    END IF;

    EXECUTE def;
  END IF;
END
$mig$;

-- ---- Patch sync_pull ------------------------------------------------------

DO $mig$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO def
    FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace
     AND proname = 'sync_pull';

  IF def IS NULL THEN
    RAISE EXCEPTION 'sync_pull not found';
  END IF;

  IF position('grazing_periods' in def) = 0
     OR position('data_import_batches' in def) = 0 THEN
    IF position('client_schema_version' in def) = 0 THEN
      RAISE EXCEPTION 'sync_pull must support client_schema_version before adding data imports';
    END IF;

    def := replace(
      def,
      $anchor$RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$anchor$,
      $block$-- Grazing periods and import batches (local schema >= 22)
  IF client_schema_version >= 22 THEN
    IF last_pulled_at > 0 THEN
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO created_records
        FROM grazing_periods t
       WHERE created_at > since_timestamp
         AND is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);

      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO updated_records
        FROM grazing_periods t
       WHERE updated_at > since_timestamp
         AND created_at <= since_timestamp
         AND is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);

      SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
        INTO deleted_ids
        FROM grazing_periods
       WHERE updated_at > since_timestamp
         AND is_deleted = true
         AND organization_id::TEXT = ANY(user_org_ids);
    ELSE
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO created_records
        FROM grazing_periods t
       WHERE is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);
      updated_records := '[]'::jsonb;
      deleted_ids := '[]'::jsonb;
    END IF;

    changes := changes || jsonb_build_object(
      'grazing_periods',
      jsonb_build_object(
        'created', created_records,
        'updated', updated_records,
        'deleted', deleted_ids
      )
    );

    IF last_pulled_at > 0 THEN
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO created_records
        FROM data_import_batches t
       WHERE created_at > since_timestamp
         AND is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);

      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO updated_records
        FROM data_import_batches t
       WHERE updated_at > since_timestamp
         AND created_at <= since_timestamp
         AND is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);

      SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
        INTO deleted_ids
        FROM data_import_batches
       WHERE updated_at > since_timestamp
         AND is_deleted = true
         AND organization_id::TEXT = ANY(user_org_ids);
    ELSE
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO created_records
        FROM data_import_batches t
       WHERE is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);
      updated_records := '[]'::jsonb;
      deleted_ids := '[]'::jsonb;
    END IF;

    changes := changes || jsonb_build_object(
      'data_import_batches',
      jsonb_build_object(
        'created', created_records,
        'updated', updated_records,
        'deleted', deleted_ids
      )
    );
  END IF;

  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$block$
    );

    IF position('grazing_periods' in def) = 0
       OR position('data_import_batches' in def) = 0 THEN
      RAISE EXCEPTION 'sync_pull RETURN anchor not found — patch manually';
    END IF;

    EXECUTE def;
  END IF;
END
$mig$;
