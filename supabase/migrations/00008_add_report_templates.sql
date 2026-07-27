-- ---------------------------------------------------------------------------
-- 00008: report_templates — saved custom report definitions (app schema v18)
--
-- 1. New table `report_templates`. filters/sections/columns are TEXT (JSON
--    strings), NOT jsonb, on purpose: the client sync layer round-trips string
--    columns untouched, so we avoid touching JSONB_FIELDS coercion in
--    app/services/sync_rpc.ts.
--
-- 2. sync_push / sync_pull are patched IN PLACE via pg_get_functiondef
--    (the 00006 technique) because the deployed functions have drifted from
--    the repo SQL. Guarded on position('report_templates' ...) = 0 so
--    re-running is a no-op.
--
-- 3. Back-compat: sync_pull gains a `client_schema_version int DEFAULT 17`
--    parameter and only includes report_templates when the caller reports
--    schema >= 18. Old app builds keep calling with one argument and never
--    receive the unknown table (their WatermelonDB would throw on it). The
--    old single-arg overload is DROPPED so PostgREST dispatch stays
--    unambiguous. Ship this migration BEFORE the v18 app build.
-- ---------------------------------------------------------------------------

-- ---- 1. Table -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL DEFAULT 'custom',
  filters TEXT,
  group_by TEXT,
  sections TEXT,
  columns TEXT,
  last_run_at TIMESTAMPTZ,
  created_by_user_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_report_templates_org ON report_templates(organization_id);

ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

DO $pol$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'report_templates' AND policyname = 'report_templates_all'
  ) THEN
    CREATE POLICY "report_templates_all" ON report_templates FOR ALL
      USING (is_org_member(organization_id));
  END IF;
END
$pol$;

-- No updated_at trigger: like the other sync-managed tables (animals,
-- pastures, *_records), updated_at is owned by the sync engine.

-- ---- 2. Patch sync_push ----------------------------------------------------

DO $mig$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO def
    FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_push';

  IF def IS NULL THEN
    RAISE EXCEPTION 'sync_push not found';
  END IF;

  IF position('report_templates' in def) = 0 THEN
    -- Insert the report_templates block just before the final RETURN.
    def := replace(def,
      $anchor$RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);$anchor$,
      $block$-- ---- Report Templates --------------------------------------------------
  IF changes ? 'report_templates' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'report_templates'->'created', '[]'::jsonb) ||
      COALESCE(changes->'report_templates'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO report_templates (
          id, organization_id, name, description, report_type,
          filters, group_by, sections, columns, last_run_at,
          created_by_user_id, created_by_name,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'name',
          rec->>'description',
          COALESCE(rec->>'report_type', 'custom'),
          rec->>'filters',
          rec->>'group_by',
          rec->>'sections',
          rec->>'columns',
          NULLIF(rec->>'last_run_at', '')::timestamptz,
          rec->>'created_by_user_id',
          rec->>'created_by_name',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          name               = EXCLUDED.name,
          description        = EXCLUDED.description,
          report_type        = EXCLUDED.report_type,
          filters            = EXCLUDED.filters,
          group_by           = EXCLUDED.group_by,
          sections           = EXCLUDED.sections,
          columns            = EXCLUDED.columns,
          last_run_at        = EXCLUDED.last_run_at,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name    = EXCLUDED.created_by_name,
          updated_at         = EXCLUDED.updated_at,
          is_deleted         = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'report_templates', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'report_templates'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE report_templates SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'report_templates', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);$block$);

    EXECUTE def;
    RAISE NOTICE 'sync_push patched for report_templates';
  ELSE
    RAISE NOTICE 'sync_push already knows report_templates; skipping';
  END IF;
END
$mig$;

-- ---- 3. Patch sync_pull (new signature + gated table) ----------------------

DO $mig$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO def
    FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_pull';

  IF def IS NULL THEN
    RAISE EXCEPTION 'sync_pull not found';
  END IF;

  IF position('report_templates' in def) = 0 THEN
    -- New signature: extra defaulted param so old clients keep working
    IF position('client_schema_version' in def) = 0 THEN
      def := replace(def,
        'sync_pull(last_pulled_at bigint DEFAULT 0)',
        'sync_pull(last_pulled_at bigint DEFAULT 0, client_schema_version integer DEFAULT 17)');
      IF position('client_schema_version' in def) = 0 THEN
        RAISE EXCEPTION 'sync_pull signature anchor not found — deployed definition drifted; patch manually';
      END IF;
    END IF;

    -- Report templates block before the final RETURN, gated on schema version
    def := replace(def,
      $anchor$RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$anchor$,
      $block$-- Report Templates (only clients on local schema >= 18 know this table)
  IF client_schema_version >= 18 THEN
    IF last_pulled_at > 0 THEN
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM report_templates t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM report_templates t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
      SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM report_templates WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
    ELSE
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM report_templates t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
      updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
    END IF;
    changes := changes || jsonb_build_object('report_templates', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));
  END IF;

  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$block$);

    IF position('report_templates' in def) = 0 THEN
      RAISE EXCEPTION 'sync_pull RETURN anchor not found — deployed definition drifted; patch manually';
    END IF;

    -- Drop the single-arg overload so PostgREST dispatch is unambiguous,
    -- then install the two-arg version.
    DROP FUNCTION IF EXISTS public.sync_pull(bigint);
    EXECUTE def;
    RAISE NOTICE 'sync_pull patched for report_templates + client_schema_version';
  ELSE
    RAISE NOTICE 'sync_pull already knows report_templates; skipping';
  END IF;
END
$mig$;
