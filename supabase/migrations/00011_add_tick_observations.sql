-- ---------------------------------------------------------------------------
-- 00011: tick observations in pasture_activities (app schema v20)
--
-- Adds chart-ready tick burden fields to the existing pasture log and patches
-- sync for databases where 00010 was already applied before these fields were
-- introduced.
-- ---------------------------------------------------------------------------

ALTER TABLE pasture_activities
  ADD COLUMN IF NOT EXISTS tick_load_score INTEGER,
  ADD COLUMN IF NOT EXISTS animals_inspected INTEGER;

ALTER TABLE pasture_activities
  DROP CONSTRAINT IF EXISTS pasture_activities_activity_type_check;

ALTER TABLE pasture_activities
  ADD CONSTRAINT pasture_activities_activity_type_check CHECK (
    activity_type IN (
      'burning',
      'slashing',
      'brush_cutting',
      'chainsaw',
      'invasive_clearing',
      'tick_observation',
      'other'
    )
  );

ALTER TABLE pasture_activities
  DROP CONSTRAINT IF EXISTS pasture_activities_tick_load_score_check;

ALTER TABLE pasture_activities
  ADD CONSTRAINT pasture_activities_tick_load_score_check CHECK (
    tick_load_score IS NULL OR tick_load_score BETWEEN 0 AND 5
  );

ALTER TABLE pasture_activities
  DROP CONSTRAINT IF EXISTS pasture_activities_animals_inspected_check;

ALTER TABLE pasture_activities
  ADD CONSTRAINT pasture_activities_animals_inspected_check CHECK (
    animals_inspected IS NULL OR animals_inspected > 0
  );

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

  IF position('tick_load_score' in def) = 0 THEN
    def := replace(
      def,
      $old$target_species, area_hectares, performed_by, notes, photos,
          created_by_user_id, created_by_name,$old$,
      $new$target_species, area_hectares, performed_by, notes, photos,
          tick_load_score, animals_inspected,
          created_by_user_id, created_by_name,$new$
    );

    def := replace(
      def,
      $old$rec->>'notes',
          rec->>'photos',
          rec->>'created_by_user_id',$old$,
      $new$rec->>'notes',
          rec->>'photos',
          NULLIF(rec->>'tick_load_score', '')::integer,
          NULLIF(rec->>'animals_inspected', '')::integer,
          rec->>'created_by_user_id',$new$
    );

    def := replace(
      def,
      $old$photos             = EXCLUDED.photos,
          created_by_user_id = EXCLUDED.created_by_user_id,$old$,
      $new$photos             = EXCLUDED.photos,
          tick_load_score    = EXCLUDED.tick_load_score,
          animals_inspected  = EXCLUDED.animals_inspected,
          created_by_user_id = EXCLUDED.created_by_user_id,$new$
    );

    IF position('tick_load_score' in def) = 0 THEN
      RAISE EXCEPTION 'pasture_activities sync_push block could not be patched';
    END IF;

    EXECUTE def;
  END IF;
END
$mig$;

-- ---- Patch sync_pull compatibility gate ----------------------------------
--
-- row_to_json now includes the two new columns. Only v20+ clients know those
-- local columns, so withhold this table from v19 clients rather than sending
-- WatermelonDB fields their schema does not contain.

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

  IF position('client_schema_version >= 19' in def) > 0 THEN
    def := replace(
      def,
      'client_schema_version >= 19',
      'client_schema_version >= 20'
    );
    EXECUTE def;
  ELSIF position('client_schema_version >= 20' in def) = 0 THEN
    RAISE EXCEPTION 'pasture_activities sync_pull version gate could not be patched';
  END IF;
END
$mig$;
