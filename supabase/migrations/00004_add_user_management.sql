-- ============================================================
-- User Management Migration
-- Adds invites table and simplifies roles to admin/worker
-- ============================================================

-- ============================================================
-- 1. Update memberships table to use simplified roles
-- ============================================================

-- Drop existing check constraint on role
ALTER TABLE public.memberships
  DROP CONSTRAINT IF EXISTS memberships_role_check;

-- Add new check constraint with simplified roles
ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_role_check
  CHECK (role IN ('admin', 'worker'));

-- Migrate existing roles to new system
UPDATE public.memberships
SET role = CASE
  WHEN role IN ('owner', 'admin') THEN 'admin'
  ELSE 'worker'
END;

-- Add additional fields to memberships
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS invited_at timestamptz DEFAULT now();

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS joined_at timestamptz;

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing memberships to set joined_at
UPDATE public.memberships
SET joined_at = created_at
WHERE joined_at IS NULL;

-- ============================================================
-- 2. Create invites table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'worker')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  invite_code text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_invites_org ON public.invites(organization_id);
CREATE INDEX idx_invites_code ON public.invites(invite_code);
CREATE INDEX idx_invites_email ON public.invites(email);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS Policies for invites
-- ============================================================

-- Admins can view invites for their organization
CREATE POLICY "Admins can view org invites"
  ON public.invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = invites.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'admin'
        AND memberships.is_active = true
    )
  );

-- Admins can create invites for their organization
CREATE POLICY "Admins can create invites"
  ON public.invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = invites.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'admin'
        AND memberships.is_active = true
    )
  );

-- Admins can delete (cancel) invites
CREATE POLICY "Admins can delete invites"
  ON public.invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = invites.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'admin'
        AND memberships.is_active = true
    )
  );

-- Anyone can view their own invite by code (for accepting)
CREATE POLICY "Users can view invites by code"
  ON public.invites FOR SELECT
  USING (true);

-- Anyone can update invite to mark as accepted
CREATE POLICY "Users can accept invites"
  ON public.invites FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. Update organizations to track livestock_types and location
-- ============================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS livestock_types text;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS location text;

-- ============================================================
-- 5. Helper function: generate invite code
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No confusing chars
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. Helper function: accept invite
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_invite(invite_code_param text)
RETURNS jsonb AS $$
DECLARE
  invite_record record;
  new_membership_id uuid;
BEGIN
  -- Find the invite
  SELECT * INTO invite_record
  FROM public.invites
  WHERE invite_code = invite_code_param
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = invite_record.organization_id
      AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this organization');
  END IF;

  -- Create membership
  INSERT INTO public.memberships (
    user_id,
    organization_id,
    role,
    invited_by,
    invited_at,
    joined_at,
    is_active
  ) VALUES (
    auth.uid(),
    invite_record.organization_id,
    invite_record.role,
    invite_record.invited_by,
    invite_record.created_at,
    now(),
    true
  ) RETURNING id INTO new_membership_id;

  -- Mark invite as accepted
  UPDATE public.invites
  SET accepted_at = now()
  WHERE id = invite_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', invite_record.organization_id,
    'membership_id', new_membership_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. Update auto_add_org_owner to use 'admin' role
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.memberships (user_id, organization_id, role, joined_at, is_active)
  VALUES (auth.uid(), new.id, 'admin', now(), true);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. Update memberships RLS to respect is_active flag
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;

-- Recreate with is_active check
CREATE POLICY "Admins can manage memberships"
  ON public.memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = memberships.organization_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
        AND m.is_active = true
    )
  );

-- ============================================================
-- 9. Update organizations RLS to respect is_active flag
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members can update their organizations" ON public.organizations;

-- Recreate with is_active check
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = organizations.id
        AND memberships.user_id = auth.uid()
        AND memberships.is_active = true
    )
  );

CREATE POLICY "Admins can update their organizations"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = organizations.id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'admin'
        AND memberships.is_active = true
    )
  );

-- ============================================================
-- 10. Add updated_at trigger for invites
-- ============================================================

CREATE TRIGGER invites_updated_at BEFORE UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 11. Add WatermelonDB sync columns to new tables
-- ============================================================

-- Note: invites table doesn't need sync columns since it's server-only
-- memberships might need them if we want to show team members offline

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS _changed text DEFAULT '';

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS _status text DEFAULT 'created';

CREATE INDEX IF NOT EXISTS idx_memberships_changed ON public.memberships(_changed);
