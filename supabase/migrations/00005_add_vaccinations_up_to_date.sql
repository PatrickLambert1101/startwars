-- Add vaccinations_up_to_date to animals.
--
-- When a farmer adds an animal that is already part of an established herd, the
-- age-based schedules would otherwise back-fill every shot the animal has ever
-- been due for, landing as a pile of overdue records on day one. This flag lets
-- the farmer say "this animal is current as of now", and the scheduler then only
-- generates vaccinations that fall due in the future.
--
-- Defaults to FALSE, which is deliberate and is NOT the app-level default.
--
-- The column default only governs (a) rows that already exist at migration time
-- and (b) inserts from older clients that don't send the column. Both must keep
-- today's back-filling behaviour:
--
--   * Existing rows: WatermelonDB backfills new boolean columns as false, so
--     every animal already on a device becomes false. Defaulting Postgres to
--     TRUE would make the same animal false locally and true remotely, and
--     whichever side synced first would win — identical animals diverging by
--     sync order. FALSE keeps both sides in agreement.
--   * Older clients: they never send this column, so they must keep the old
--     back-fill behaviour rather than silently opting into skipping doses.
--
-- New animals from a current build always send an explicit value (the forms
-- default the toggle to true), so they never rely on this default.
--
-- IMPORTANT: this must be applied BEFORE shipping the app build that adds the
-- matching WatermelonDB column. sync_rpc pushes whole records, so the client
-- will send this column and Postgres will reject the write if it is absent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'animals' AND column_name = 'vaccinations_up_to_date'
  ) THEN
    ALTER TABLE animals ADD COLUMN vaccinations_up_to_date BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;
