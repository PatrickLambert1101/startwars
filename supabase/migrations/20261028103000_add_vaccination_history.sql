-- Explicit history for schema v25. NULL preserves pre-existing legacy settings.
-- Apply before a build using schema v25 syncs with production.
BEGIN;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS vaccination_history text
  CHECK (vaccination_history IS NULL OR vaccination_history IN ('current','needs_review','unknown'));

DO $mig$
DECLARE
  original text;
  patched text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO STRICT original FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname='sync_push';
  IF position('vaccination_history' in original)=0 THEN
    patched := regexp_replace(original,
      'status,[[:space:]]*vaccinations_up_to_date,',
      'status, vaccinations_up_to_date, vaccination_history,');
    patched := replace(patched,
      'COALESCE((rec->>''vaccinations_up_to_date'')::boolean, false),',
      'COALESCE((rec->>''vaccinations_up_to_date'')::boolean, false), rec->>''vaccination_history'',');
    patched := regexp_replace(patched,
      'vaccinations_up_to_date[[:space:]]*=[[:space:]]*EXCLUDED.vaccinations_up_to_date,',
      'vaccinations_up_to_date = EXCLUDED.vaccinations_up_to_date,
       vaccination_history = CASE WHEN rec ? ''vaccination_history'' THEN EXCLUDED.vaccination_history
         WHEN EXCLUDED.vaccinations_up_to_date IS DISTINCT FROM animals.vaccinations_up_to_date THEN NULL
         ELSE animals.vaccination_history END,');
    IF position('rec->>''vaccination_history''' in patched)=0 OR
       position('vaccination_history = CASE' in patched)=0 OR
       position('vaccinations_up_to_date, vaccination_history,' in patched)=0 THEN
      RAISE EXCEPTION 'Cannot safely patch vaccination-history sync_push';
    END IF;
    EXECUTE patched;
  END IF;

  SELECT pg_get_functiondef(oid) INTO STRICT original FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname='sync_pull';
  IF position('vaccination_history' in original)=0 THEN
    patched := replace(original,
      $anchor$RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);$anchor$,
      $replacement$
      -- History is only returned to clients that have the v25 column.
      DECLARE history_kind text; history_rows jsonb;
      BEGIN
        IF client_schema_version >= 25 AND changes ? 'animals' THEN
          FOREACH history_kind IN ARRAY ARRAY['created','updated'] LOOP
            SELECT COALESCE(jsonb_agg(entry.value || jsonb_build_object('vaccination_history', animal.vaccination_history)
                       ORDER BY entry.ordinality), '[]'::jsonb)
              INTO history_rows
              FROM jsonb_array_elements(COALESCE(changes #> ARRAY['animals', history_kind], '[]'::jsonb))
                WITH ORDINALITY AS entry(value, ordinality)
              JOIN public.animals animal ON animal.id::text = entry.value->>'id';
            changes := jsonb_set(changes, ARRAY['animals', history_kind], history_rows);
          END LOOP;
        END IF;
      END;
      RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);
      $replacement$);
    IF position('WITH ORDINALITY AS entry' in patched)=0 THEN
      RAISE EXCEPTION 'Cannot safely patch vaccination-history sync_pull';
    END IF;
    EXECUTE patched;
  END IF;
END $mig$;
COMMIT;
