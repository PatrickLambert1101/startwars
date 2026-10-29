-- Device timestamps describe when work happened, not when another client can see it.
-- Keep those dates intact and use a server clock for incremental synchronization.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- A statement lock is acquired before row locks. Pulls hold the same transaction
-- lock, so a write cannot commit behind a checkpoint that has already been read.
CREATE OR REPLACE FUNCTION public.herd_sync_write_lock()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $function$
BEGIN
  PERFORM pg_advisory_xact_lock(724815, 1);
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.herd_sync_stamp()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $function$
BEGIN
  NEW.sync_updated_at := clock_timestamp();
  IF TG_OP = 'INSERT' THEN
    NEW.sync_created_at := NEW.sync_updated_at;
  ELSE
    NEW.sync_created_at := COALESCE(OLD.sync_created_at, OLD.created_at);
  END IF;
  RETURN NEW;
END;
$function$;

DO $migration$
DECLARE
  table_name text;
  original text;
  patched text;
  predicate_count integer;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'organizations', 'memberships', 'pastures', 'animals',
    'treatment_protocols', 'health_records', 'weight_records', 'breeding_records',
    'pasture_movements', 'vaccination_schedules', 'scheduled_vaccinations',
    'grazing_periods', 'report_templates', 'pasture_activities',
    'pasture_boundaries', 'data_import_batches'
  ] LOOP
    -- Existing rows retain NULL markers and use their original dates. No history
    -- backfill is needed, and existing updated_at triggers are not fired.
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS sync_created_at timestamptz, ADD COLUMN IF NOT EXISTS sync_updated_at timestamptz', table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS herd_sync_lock ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER herd_sync_lock BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.herd_sync_write_lock()', table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS herd_sync_clock ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER herd_sync_clock BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.herd_sync_stamp()', table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I ((COALESCE(sync_created_at, created_at)))', table_name || '_sync_created_idx', table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I ((COALESCE(sync_updated_at, updated_at)))', table_name || '_sync_updated_idx', table_name);
  END LOOP;

  SELECT pg_get_functiondef(oid) INTO STRICT original FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_pull';
  IF position('-- herd_sync_clock_lock' in original) = 0 THEN
    SELECT count(*) INTO predicate_count FROM regexp_matches(original,
      '\m(created_at|updated_at)[[:space:]]*(>|<=)[[:space:]]*since_timestamp', 'g');
    IF predicate_count <> 64 THEN
      RAISE EXCEPTION 'Unexpected sync_pull shape: % clock predicates, expected 64', predicate_count;
    END IF;
    patched := regexp_replace(original,
      '\m(created_at|updated_at)([[:space:]]*(>|<=)[[:space:]]*since_timestamp)',
      'COALESCE(sync_\1, \1)\2', 'g');
    patched := replace(patched,
      'timestamp_now   := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);',
      '-- herd_sync_clock_lock
  PERFORM pg_advisory_xact_lock(724815, 1);
  timestamp_now := floor(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint;');
    IF position('-- herd_sync_clock_lock' in patched) = 0 THEN
      RAISE EXCEPTION 'Cannot safely patch sync_pull checkpoint';
    END IF;
    EXECUTE patched;
  END IF;

  -- Acquire before reading authorization or entering per-record exception blocks.
  SELECT pg_get_functiondef(oid) INTO STRICT original FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_push';
  IF position('-- herd_sync_clock_lock' in original) = 0 THEN
    patched := regexp_replace(original, '\mBEGIN\M',
      'BEGIN
  -- herd_sync_clock_lock
  PERFORM pg_advisory_xact_lock(724815, 1);');
    IF position('-- herd_sync_clock_lock' in patched) = 0 THEN
      RAISE EXCEPTION 'Cannot safely patch sync_push lock';
    END IF;
    EXECUTE patched;
  END IF;
END;
$migration$;
COMMIT;
