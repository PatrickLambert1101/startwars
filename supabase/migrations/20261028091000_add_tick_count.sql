-- Exact tick counts supplement the existing 0-5 burden score (local schema v24).
-- Apply before releasing the custom input update. No existing observations are backfilled.
BEGIN;
ALTER TABLE public.pasture_activities
  ADD COLUMN IF NOT EXISTS tick_count INTEGER
  CHECK (tick_count IS NULL OR tick_count BETWEEN 0 AND 99999999);

DO $mig$
DECLARE
  def text;
  patched text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO STRICT def FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_push';
  IF position('rec->>''tick_count''' in def) = 0 THEN
    patched := replace(def, 'tick_load_score, animals_inspected,', 'tick_load_score, animals_inspected, tick_count,');
    patched := replace(patched,
      'NULLIF(rec->>''animals_inspected'', '''')::integer,',
      'NULLIF(rec->>''animals_inspected'', '''')::integer, NULLIF(rec->>''tick_count'', '''')::integer,');
    patched := replace(patched,
      'animals_inspected  = EXCLUDED.animals_inspected,',
      'animals_inspected  = EXCLUDED.animals_inspected,
          tick_count = CASE WHEN rec ? ''tick_count'' THEN EXCLUDED.tick_count ELSE pasture_activities.tick_count END,');
    IF position('tick_count = CASE' in patched) = 0 OR position('rec->>''tick_count''' in patched) = 0 THEN
      RAISE EXCEPTION 'Could not patch tick-count sync_push';
    END IF;
    EXECUTE patched;
  END IF;

  SELECT pg_get_functiondef(oid) INTO STRICT def FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_pull';
  -- Old clients continue receiving pasture observations, without the new field.
  patched := regexp_replace(def,
    'jsonb_agg\(row_to_json\(t\)\)(, ''\[\]''::jsonb\)[[:space:]]+INTO (created_records|updated_records)[[:space:]]+FROM pasture_activities t)',
    'jsonb_agg(CASE WHEN client_schema_version >= 24 THEN to_jsonb(t) ELSE to_jsonb(t) - ''tick_count'' END)\1', 'g');
  IF position('to_jsonb(t) - ''tick_count''' in patched) = 0 THEN
    RAISE EXCEPTION 'Could not patch tick-count sync_pull';
  END IF;
  EXECUTE patched;
END
$mig$;
COMMIT;
