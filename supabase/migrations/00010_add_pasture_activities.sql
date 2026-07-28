-- ---------------------------------------------------------------------------
-- 00010: pasture_activities — dated pasture intervention log (app schema v19)
--
-- Ship this migration before the v19 app build. The sync_pull addition is
-- gated by client schema version so older builds never receive an unknown
-- WatermelonDB table.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pasture_activities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pasture_id TEXT NOT NULL REFERENCES pastures(id) ON DELETE CASCADE,
  activity_date TIMESTAMPTZ NOT NULL,
  activity_type TEXT NOT NULL CHECK (
    activity_type IN (
      'burning',
      'slashing',
      'brush_cutting',
      'chainsaw',
      'invasive_clearing',
      'tick_observation',
      'other'
    )
  ),
  target_species TEXT,
  area_hectares NUMERIC CHECK (area_hectares IS NULL OR area_hectares > 0),
  performed_by TEXT,
  notes TEXT,
  photos TEXT,
  tick_load_score INTEGER CHECK (
    tick_load_score IS NULL OR tick_load_score BETWEEN 0 AND 5
  ),
  animals_inspected INTEGER CHECK (
    animals_inspected IS NULL OR animals_inspected > 0
  ),
  created_by_user_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_pasture_activities_org
  ON pasture_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_pasture_activities_pasture_date
  ON pasture_activities(pasture_id, activity_date DESC);

ALTER TABLE pasture_activities ENABLE ROW LEVEL SECURITY;

DO $pol$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'pasture_activities'
       AND policyname = 'pasture_activities_all'
  ) THEN
    CREATE POLICY "pasture_activities_all" ON pasture_activities FOR ALL
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

  IF position('pasture_activities' in def) = 0 THEN
    def := replace(
      def,
      $anchor$RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);$anchor$,
      $block$-- ---- Pasture Activities -----------------------------------------------
  IF changes ? 'pasture_activities' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'pasture_activities'->'created', '[]'::jsonb) ||
      COALESCE(changes->'pasture_activities'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO pasture_activities (
          id, organization_id, pasture_id, activity_date, activity_type,
          target_species, area_hectares, performed_by, notes, photos,
          tick_load_score, animals_inspected,
          created_by_user_id, created_by_name,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'pasture_id',
          (rec->>'activity_date')::timestamptz,
          rec->>'activity_type',
          rec->>'target_species',
          NULLIF(rec->>'area_hectares', '')::numeric,
          rec->>'performed_by',
          rec->>'notes',
          rec->>'photos',
          NULLIF(rec->>'tick_load_score', '')::integer,
          NULLIF(rec->>'animals_inspected', '')::integer,
          rec->>'created_by_user_id',
          rec->>'created_by_name',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          pasture_id         = EXCLUDED.pasture_id,
          activity_date      = EXCLUDED.activity_date,
          activity_type      = EXCLUDED.activity_type,
          target_species     = EXCLUDED.target_species,
          area_hectares      = EXCLUDED.area_hectares,
          performed_by       = EXCLUDED.performed_by,
          notes              = EXCLUDED.notes,
          photos             = EXCLUDED.photos,
          tick_load_score    = EXCLUDED.tick_load_score,
          animals_inspected  = EXCLUDED.animals_inspected,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name    = EXCLUDED.created_by_name,
          updated_at         = EXCLUDED.updated_at,
          is_deleted         = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object(
          'table', 'pasture_activities',
          'record_id', rec->>'id',
          'error', SQLERRM
        );
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(
        COALESCE(changes->'pasture_activities'->'deleted', '[]'::jsonb)
      )
    LOOP
      BEGIN
        UPDATE pasture_activities
           SET is_deleted = true, updated_at = NOW()
         WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object(
          'table', 'pasture_activities',
          'record_id', rec_id,
          'error', SQLERRM
        );
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);$block$
    );

    IF position('pasture_activities' in def) = 0 THEN
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

  IF position('pasture_activities' in def) = 0 THEN
    IF position('client_schema_version' in def) = 0 THEN
      RAISE EXCEPTION 'sync_pull must support client_schema_version before adding pasture activities';
    END IF;

    def := replace(
      def,
      $anchor$RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$anchor$,
      $block$-- Pasture activities (only local schema >= 19 knows this table)
  IF client_schema_version >= 19 THEN
    IF last_pulled_at > 0 THEN
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO created_records
        FROM pasture_activities t
       WHERE created_at > since_timestamp
         AND is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);

      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO updated_records
        FROM pasture_activities t
       WHERE updated_at > since_timestamp
         AND created_at <= since_timestamp
         AND is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);

      SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
        INTO deleted_ids
        FROM pasture_activities
       WHERE updated_at > since_timestamp
         AND is_deleted = true
         AND organization_id::TEXT = ANY(user_org_ids);
    ELSE
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO created_records
        FROM pasture_activities t
       WHERE is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);
      updated_records := '[]'::jsonb;
      deleted_ids := '[]'::jsonb;
    END IF;

    changes := changes || jsonb_build_object(
      'pasture_activities',
      jsonb_build_object(
        'created', created_records,
        'updated', updated_records,
        'deleted', deleted_ids
      )
    );
  END IF;

  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$block$
    );

    IF position('pasture_activities' in def) = 0 THEN
      RAISE EXCEPTION 'sync_pull RETURN anchor not found — patch manually';
    END IF;

    EXECUTE def;
  END IF;
END
$mig$;
