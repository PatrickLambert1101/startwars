-- ============================================================
-- NUKE EVERYTHING - PASTE THIS IN SUPABASE SQL EDITOR
-- Run this first, then run the FINAL_SCHEMA.sql
-- ============================================================

-- Drop all policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Members can view ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Members can manage ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Members can view ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view org ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can update ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can create ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Users can view ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Users can create ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "Users can accept ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
        EXECUTE 'DROP POLICY IF EXISTS "System can insert ' || r.tablename || '" ON public.' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- Drop all tables
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
DROP FUNCTION IF EXISTS public.is_org_member CASCADE;
DROP FUNCTION IF EXISTS public.is_org_admin CASCADE;
DROP FUNCTION IF EXISTS public.generate_invite_code CASCADE;
DROP FUNCTION IF EXISTS public.accept_invite CASCADE;
DROP FUNCTION IF EXISTS public.auto_add_org_owner CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '💣 Database wiped clean!';
  RAISE NOTICE '';
  RAISE NOTICE 'Now paste and run FINAL_SCHEMA.sql';
END $$;
