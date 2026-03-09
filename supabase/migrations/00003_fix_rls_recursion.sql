-- Fix infinite recursion in memberships RLS policy
-- The "Admins can manage memberships" policy was checking memberships
-- within a memberships query, causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;

-- Replace with simpler policies that don't cause recursion

-- Owners/admins can update memberships in their org
CREATE POLICY "Admins can update memberships"
  ON public.memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = memberships.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- Owners/admins can delete memberships in their org
CREATE POLICY "Admins can delete memberships"
  ON public.memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = memberships.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );
