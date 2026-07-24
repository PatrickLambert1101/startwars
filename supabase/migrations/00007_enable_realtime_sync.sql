-- Enable Supabase Realtime for cross-device sync.
--
-- Context: the client (app/hooks/useSync.ts) already opens a per-org Realtime
-- channel and subscribes to `postgres_changes` on the tables below, calling
-- queueSync() on any change. That code was inert because these tables were not
-- part of the `supabase_realtime` publication, so Postgres emitted no change
-- events and every device fell back to the periodic poll. This migration adds
-- the tables to the publication so change events actually flow.
--
-- Design notes:
-- * The client ignores the event payload entirely — it only needs to know that
--   *something* changed in its org, then runs a full WatermelonDB pull/push.
--   queueSync() debounces (10s) and coalesces, so event bursts (e.g. bulk adds)
--   collapse into a single sync. No stampede.
-- * RLS is enforced on Realtime reads. Every table below has a
--   `FOR ALL ... is_org_member(organization_id)` policy, which covers the
--   SELECT check, so devices only receive events for their own org(s).
-- * Deletes in this app are SOFT deletes (is_deleted = true via UPDATE), which
--   arrive as UPDATE events carrying organization_id. We therefore do NOT need
--   REPLICA IDENTITY FULL (which would only matter for hard DELETE events, whose
--   payload otherwise carries only the primary key and can't be RLS-filtered).

-- Add each synced table to the realtime publication. Guarded so re-running is
-- safe even if a table was already added.
DO $$
DECLARE
  tbl text;
  synced_tables text[] := ARRAY[
    'animals',
    'health_records',
    'weight_records',
    'breeding_records',
    'pastures',
    'pasture_movements',
    'vaccination_schedules',
    'scheduled_vaccinations',
    'treatment_protocols'
  ];
BEGIN
  FOREACH tbl IN ARRAY synced_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
