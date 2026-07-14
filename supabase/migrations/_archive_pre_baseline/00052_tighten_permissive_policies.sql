-- ============================================================================
-- 00052 — Tighten permissive RLS policies surfaced after re-enabling RLS
-- ============================================================================
-- After 00051 re-enabled RLS on organizations and invites, two pre-existing
-- policies were flagged by the linter as overly permissive:
--
--   1. invites."Users can accept invites" (UPDATE, USING true, WITH CHECK true)
--      The real accept flow goes through accept_invite() which is
--      SECURITY DEFINER and bypasses RLS. A direct UPDATE policy on invites
--      is therefore unnecessary and wide open. Drop it.
--
--   2. organizations."Users can create organizations" (INSERT, WITH CHECK true)
--      Any authenticated user creating an org is a legitimate flow, but the
--      linter flags literal TRUE. Replace with an explicit auth.uid() check
--      (wrapped in a subquery to avoid the auth_rls_initplan warning).
-- ============================================================================

DROP POLICY IF EXISTS "Users can accept invites" ON public.invites;

DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
