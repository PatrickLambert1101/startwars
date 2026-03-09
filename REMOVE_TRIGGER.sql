-- Remove the trigger that auto-creates memberships
-- We're now creating memberships locally in WatermelonDB instead

DROP TRIGGER IF EXISTS org_auto_membership ON organizations;
DROP FUNCTION IF EXISTS public.auto_add_org_owner() CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Removed auto_add_org_owner trigger';
  RAISE NOTICE 'Memberships are now created locally in WatermelonDB';
END $$;
