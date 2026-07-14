-- ============================================================================
-- 00051 — Security Advisor Fixes
-- ============================================================================
-- Addresses issues flagged by Supabase's database linter:
--
--   CRITICAL (ERROR):
--     - rls_disabled_in_public / policy_exists_rls_disabled for
--       public.organizations  (drifted: policies exist but RLS was manually
--                               disabled via temp_disable_org_rls.sql)
--     - rls_disabled_in_public / policy_exists_rls_disabled for
--       public.invites        (drifted: policies exist but RLS was manually
--                               disabled via disable_invites_rls_temporarily.sql)
--
--   WARNINGS:
--     - rls_policy_always_true on memberships."System can insert memberships"
--       (had WITH CHECK (TRUE), now restricted to inserting your OWN membership)
--     - function_search_path_mutable for 14 SECURITY DEFINER / trigger functions
--       (pins search_path so a malicious caller cannot shadow public objects)
--
--   NOT FIXABLE IN MIGRATION (requires dashboard action):
--     - auth_leaked_password_protection  — enable in Auth > Providers settings
--       (Supabase Dashboard → Authentication → Providers → Password policy)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Re-enable RLS on drifted tables
-- ----------------------------------------------------------------------------
-- Policies already exist on both tables (see 00001_complete_schema.sql and
-- 00016_invites_rls_policy.sql); they were rendered inert when RLS was
-- disabled in the ad-hoc scripts at the repo root. Turning RLS back on
-- re-activates the existing policies without redefining them.

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites       ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Tighten the permissive memberships INSERT policy
-- ----------------------------------------------------------------------------
-- The original "System can insert memberships" policy used WITH CHECK (TRUE),
-- which lets any authenticated user insert a membership row for ANY user in
-- ANY organization. That's strictly weaker than "authenticated" access.
--
-- The real requirement (from sync_rpc.ts / auto_add_org_owner trigger) is that
-- a user can insert membership rows FOR THEMSELVES. Admin-managed invites go
-- through the invites table + accept_invite() function, which runs as
-- SECURITY DEFINER and bypasses this policy anyway.

DROP POLICY IF EXISTS "System can insert memberships" ON public.memberships;

CREATE POLICY "Users can insert their own memberships"
  ON public.memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. Pin search_path on flagged functions
-- ----------------------------------------------------------------------------
-- PostgreSQL functions without an explicit search_path inherit the caller's
-- search_path, which is a privilege-escalation vector for SECURITY DEFINER
-- functions. ALTER FUNCTION ... SET search_path attaches the setting without
-- rewriting the function body, so this is safe to run regardless of which
-- migration last defined each function.

ALTER FUNCTION public.update_vaccination_schedules_updated_at()              SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_scheduled_vaccinations_updated_at()             SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_super_user(uuid, text)                              SET search_path = public, pg_catalog;
ALTER FUNCTION public.add_super_user(text, text)                             SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_super_users_updated_at()                        SET search_path = public, pg_catalog;
ALTER FUNCTION public.sync_push(jsonb)                                       SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_org_member(text, uuid)                              SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_org_admin(text, uuid)                               SET search_path = public, pg_catalog;
ALTER FUNCTION public.accept_invite(text)                                    SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_updated_at()                                       SET search_path = public, pg_catalog;
ALTER FUNCTION public.generate_invite_code()                                 SET search_path = public, pg_catalog;
ALTER FUNCTION public.auto_add_org_owner()                                   SET search_path = public, pg_catalog;
ALTER FUNCTION public.epoch_to_timestamp(bigint)                             SET search_path = public, pg_catalog;
ALTER FUNCTION public.timestamp_to_epoch(timestamp with time zone)           SET search_path = public, pg_catalog;

-- ----------------------------------------------------------------------------
-- Success notice
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ Security advisor fixes applied';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '  • RLS re-enabled on organizations and invites';
  RAISE NOTICE '  • memberships INSERT policy restricted to auth.uid() = user_id';
  RAISE NOTICE '  • search_path pinned on 14 functions';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Still TODO in the Supabase dashboard:';
  RAISE NOTICE '  • Enable "Leaked password protection" under';
  RAISE NOTICE '    Authentication → Providers → Password policy';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Delete the ad-hoc scripts at the repo root so this never';
  RAISE NOTICE '    drifts again:';
  RAISE NOTICE '     - temp_disable_org_rls.sql';
  RAISE NOTICE '     - disable_invites_rls_temporarily.sql';
  RAISE NOTICE '============================================================================';
END $$;
