-- Teach the sync RPCs about animals.vaccinations_up_to_date.
--
-- 00005 adds the column, but that alone is not enough: sync_push and sync_pull
-- enumerate every column explicitly rather than using to_jsonb / SELECT *, so an
-- unknown column is silently dropped on push and never returned on pull. The
-- feature would look correct on-device and never leave it.
--
-- WHY THIS PATCHES pg_get_functiondef INSTEAD OF RE-DECLARING THE FUNCTIONS:
-- the deployed sync_push/sync_pull do NOT match 00004_fix_sync_engine.sql. The
-- live bodies are formatted differently (compact multi-value VALUES lines, no
-- alignment padding in ON CONFLICT), i.e. the database has drifted from the
-- migration file. Pasting 00004's text back with one extra column would quietly
-- revert whatever that drift represents. Instead we read the *live* definition,
-- thread the new column through the animals statements, and re-execute it — so
-- only the intended change lands and everything else is preserved byte for byte.
--
-- Anchor uniqueness was verified against the live definitions before writing
-- this: each sync_push anchor matches exactly once, and all three sync_pull
-- matches are on animals projections, so the unscoped replace() calls below
-- cannot touch another table's block.
--
-- Push COALESCEs a missing value to false so an older client that omits the
-- field keeps today's back-filling behaviour instead of silently opting out.
--
-- Guarded on `position(...) = 0`, so re-running is a no-op.
DO $mig$
DECLARE
  def text;
BEGIN
  -- ---------- sync_push ----------
  SELECT pg_get_functiondef(oid) INTO def
    FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_push';

  IF def IS NULL THEN
    RAISE EXCEPTION 'sync_push not found';
  END IF;

  IF position('vaccinations_up_to_date' in def) = 0 THEN
    -- INSERT column list
    def := replace(def,
      'breed, sex, date_of_birth, status,',
      'breed, sex, date_of_birth, status, vaccinations_up_to_date,');

    -- VALUES list (positional: must follow rec->>'status' to match the column list)
    def := replace(def,
      E'\n          rec->>''status'',\n',
      E'\n          rec->>''status'',\n          COALESCE((rec->>''vaccinations_up_to_date'')::boolean, false),\n');

    -- ON CONFLICT DO UPDATE SET
    def := replace(def,
      'date_of_birth = EXCLUDED.date_of_birth, status = EXCLUDED.status,',
      'date_of_birth = EXCLUDED.date_of_birth, status = EXCLUDED.status, vaccinations_up_to_date = EXCLUDED.vaccinations_up_to_date,');

    EXECUTE def;
    RAISE NOTICE 'sync_push patched for vaccinations_up_to_date';
  ELSE
    RAISE NOTICE 'sync_push already knows vaccinations_up_to_date; skipping';
  END IF;

  -- ---------- sync_pull ----------
  SELECT pg_get_functiondef(oid) INTO def
    FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_pull';

  IF def IS NULL THEN
    RAISE EXCEPTION 'sync_pull not found';
  END IF;

  IF position('vaccinations_up_to_date' in def) = 0 THEN
    -- All three matches are the animals jsonb_build_object projections
    -- (created / updated / full-resync). The fourth animals query selects ids
    -- only for deletions and correctly has no match.
    def := replace(def,
      E'''status'', status,',
      E'''status'', status, ''vaccinations_up_to_date'', vaccinations_up_to_date,');

    EXECUTE def;
    RAISE NOTICE 'sync_pull patched for vaccinations_up_to_date';
  ELSE
    RAISE NOTICE 'sync_pull already knows vaccinations_up_to_date; skipping';
  END IF;
END
$mig$;
