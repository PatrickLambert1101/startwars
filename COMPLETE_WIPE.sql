-- ============================================================
-- COMPLETE NUCLEAR WIPE - Paste this and run it
-- ============================================================

-- Drop all triggers
DROP TRIGGER IF EXISTS org_auto_membership ON organizations;
DROP TRIGGER IF EXISTS invites_updated_at ON invites;
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS memberships_updated_at ON memberships;

-- Drop all tables (cascades will handle foreign keys)
DROP TABLE IF EXISTS public.pasture_movements CASCADE;
DROP TABLE IF EXISTS public.breeding_records CASCADE;
DROP TABLE IF EXISTS public.weight_records CASCADE;
DROP TABLE IF EXISTS public.health_records CASCADE;
DROP TABLE IF EXISTS public.treatment_protocols CASCADE;
DROP TABLE IF EXISTS public.animals CASCADE;
DROP TABLE IF EXISTS public.pastures CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.is_org_member(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_admin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.generate_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.accept_invite(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.auto_add_org_owner() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- Drop any old UUID-based functions (in case they exist)
DROP FUNCTION IF EXISTS public.is_org_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_admin(UUID, UUID) CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '💣💣💣 EVERYTHING WIPED! 💣💣💣';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All tables dropped';
  RAISE NOTICE '✅ All functions dropped';
  RAISE NOTICE '✅ All triggers dropped';
  RAISE NOTICE '';
  RAISE NOTICE '👉 NOW paste and run the FINAL_SCHEMA.sql';
END $$;
