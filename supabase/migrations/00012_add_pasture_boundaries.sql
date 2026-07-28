-- ---------------------------------------------------------------------------
-- 00012: pasture map boundaries (app schema v21)
--
-- Boundaries live in a one-to-one table so older app builds can continue
-- syncing pastures without receiving columns their local schema cannot store.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pasture_boundaries (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pasture_id TEXT NOT NULL UNIQUE REFERENCES pastures(id) ON DELETE CASCADE,
  boundary_geojson TEXT NOT NULL,
  boundary_source TEXT NOT NULL CHECK (boundary_source IN ('draw', 'kml', 'kmz')),
  boundary_source_name TEXT,
  centroid_latitude DOUBLE PRECISION NOT NULL CHECK (
    centroid_latitude BETWEEN -90 AND 90
  ),
  centroid_longitude DOUBLE PRECISION NOT NULL CHECK (
    centroid_longitude BETWEEN -180 AND 180
  ),
  calculated_area_hectares DOUBLE PRECISION NOT NULL CHECK (
    calculated_area_hectares > 0
  ),
  boundary_updated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_pasture_boundaries_org
  ON pasture_boundaries(organization_id);
CREATE INDEX IF NOT EXISTS idx_pasture_boundaries_pasture
  ON pasture_boundaries(pasture_id);

ALTER TABLE pasture_boundaries ENABLE ROW LEVEL SECURITY;

DO $pol$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'pasture_boundaries'
       AND policyname = 'pasture_boundaries_all'
  ) THEN
    CREATE POLICY "pasture_boundaries_all" ON pasture_boundaries FOR ALL
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

  IF position('pasture_boundaries' in def) = 0 THEN
    def := replace(
      def,
      $anchor$RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);$anchor$,
      $block$-- ---- Pasture Boundaries -----------------------------------------------
  IF changes ? 'pasture_boundaries' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'pasture_boundaries'->'created', '[]'::jsonb) ||
      COALESCE(changes->'pasture_boundaries'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO pasture_boundaries (
          id, organization_id, pasture_id, boundary_geojson, boundary_source,
          boundary_source_name, centroid_latitude, centroid_longitude,
          calculated_area_hectares, boundary_updated_at,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'pasture_id',
          rec->>'boundary_geojson',
          rec->>'boundary_source',
          rec->>'boundary_source_name',
          (rec->>'centroid_latitude')::double precision,
          (rec->>'centroid_longitude')::double precision,
          (rec->>'calculated_area_hectares')::double precision,
          (rec->>'boundary_updated_at')::timestamptz,
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          pasture_id                 = EXCLUDED.pasture_id,
          boundary_geojson           = EXCLUDED.boundary_geojson,
          boundary_source            = EXCLUDED.boundary_source,
          boundary_source_name       = EXCLUDED.boundary_source_name,
          centroid_latitude          = EXCLUDED.centroid_latitude,
          centroid_longitude         = EXCLUDED.centroid_longitude,
          calculated_area_hectares   = EXCLUDED.calculated_area_hectares,
          boundary_updated_at        = EXCLUDED.boundary_updated_at,
          updated_at                 = EXCLUDED.updated_at,
          is_deleted                 = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object(
          'table', 'pasture_boundaries',
          'record_id', rec->>'id',
          'error', SQLERRM
        );
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(
        COALESCE(changes->'pasture_boundaries'->'deleted', '[]'::jsonb)
      )
    LOOP
      BEGIN
        UPDATE pasture_boundaries
           SET is_deleted = true, updated_at = NOW()
         WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object(
          'table', 'pasture_boundaries',
          'record_id', rec_id,
          'error', SQLERRM
        );
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);$block$
    );

    IF position('pasture_boundaries' in def) = 0 THEN
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

  IF position('pasture_boundaries' in def) = 0 THEN
    IF position('client_schema_version' in def) = 0 THEN
      RAISE EXCEPTION 'sync_pull must support client_schema_version before adding pasture boundaries';
    END IF;

    def := replace(
      def,
      $anchor$RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$anchor$,
      $block$-- Pasture boundaries (only local schema >= 21 knows this table)
  IF client_schema_version >= 21 THEN
    IF last_pulled_at > 0 THEN
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO created_records
        FROM pasture_boundaries t
       WHERE created_at > since_timestamp
         AND is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);

      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO updated_records
        FROM pasture_boundaries t
       WHERE updated_at > since_timestamp
         AND created_at <= since_timestamp
         AND is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);

      SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
        INTO deleted_ids
        FROM pasture_boundaries
       WHERE updated_at > since_timestamp
         AND is_deleted = true
         AND organization_id::TEXT = ANY(user_org_ids);
    ELSE
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
        INTO created_records
        FROM pasture_boundaries t
       WHERE is_deleted = false
         AND organization_id::TEXT = ANY(user_org_ids);
      updated_records := '[]'::jsonb;
      deleted_ids := '[]'::jsonb;
    END IF;

    changes := changes || jsonb_build_object(
      'pasture_boundaries',
      jsonb_build_object(
        'created', created_records,
        'updated', updated_records,
        'deleted', deleted_ids
      )
    );
  END IF;

  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$block$
    );

    IF position('pasture_boundaries' in def) = 0 THEN
      RAISE EXCEPTION 'sync_pull RETURN anchor not found — patch manually';
    END IF;

    EXECUTE def;
  END IF;
END
$mig$;

