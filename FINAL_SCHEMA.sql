-- ===========================================================================
-- HERDTRACKR COMPLETE WORKING SCHEMA
-- Paste this ENTIRE file into Supabase SQL Editor and run
-- ===========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================================================
-- TABLES
-- ===========================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  name TEXT NOT NULL,
  livestock_types TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_organizations_remote_id ON organizations(remote_id);
CREATE INDEX IF NOT EXISTS idx_organizations_changed ON organizations(_changed);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created',
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_changed ON memberships(_changed);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invite_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invites_org ON invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);

CREATE TABLE IF NOT EXISTS pastures (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  size_hectares NUMERIC,
  location_notes TEXT,
  forage_type TEXT,
  water_source TEXT,
  fence_type TEXT,
  has_salt_blocks BOOLEAN,
  has_mineral_feeders BOOLEAN,
  max_capacity INTEGER,
  target_grazing_days INTEGER,
  target_rest_days INTEGER,
  current_animal_count INTEGER NOT NULL DEFAULT 0,
  last_grazed_date TIMESTAMPTZ,
  available_from_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  photos TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_pastures_org ON pastures(organization_id);
CREATE INDEX IF NOT EXISTS idx_pastures_changed ON pastures(_changed);

CREATE TABLE IF NOT EXISTS animals (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  rfid_tag TEXT,
  visual_tag TEXT,
  name TEXT,
  breed TEXT NOT NULL,
  sex TEXT NOT NULL,
  date_of_birth TIMESTAMPTZ,
  sire_id TEXT REFERENCES animals(id),
  dam_id TEXT REFERENCES animals(id),
  registration_number TEXT,
  current_pasture_id TEXT REFERENCES pastures(id),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  photos TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_animals_org ON animals(organization_id);
CREATE INDEX IF NOT EXISTS idx_animals_rfid ON animals(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_animals_visual ON animals(visual_tag);
CREATE INDEX IF NOT EXISTS idx_animals_pasture ON animals(current_pasture_id);
CREATE INDEX IF NOT EXISTS idx_animals_changed ON animals(_changed);

CREATE TABLE IF NOT EXISTS treatment_protocols (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  protocol_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  administration_method TEXT,
  withdrawal_days INTEGER,
  target_species TEXT NOT NULL,
  target_age_min INTEGER,
  target_age_max INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_protocols_org ON treatment_protocols(organization_id);
CREATE INDEX IF NOT EXISTS idx_protocols_changed ON treatment_protocols(_changed);

CREATE TABLE IF NOT EXISTS health_records (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  protocol_id TEXT REFERENCES treatment_protocols(id),
  record_date TIMESTAMPTZ NOT NULL,
  record_type TEXT NOT NULL,
  description TEXT NOT NULL,
  product_name TEXT,
  dosage TEXT,
  administered_by TEXT,
  withdrawal_date TIMESTAMPTZ,
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  photos TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_health_org ON health_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_health_animal ON health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_protocol ON health_records(protocol_id);
CREATE INDEX IF NOT EXISTS idx_health_changed ON health_records(_changed);

CREATE TABLE IF NOT EXISTS weight_records (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  record_date TIMESTAMPTZ NOT NULL,
  weight_kg NUMERIC NOT NULL,
  condition_score INTEGER CHECK (condition_score >= 1 AND condition_score <= 9),
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  photos TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_weight_org ON weight_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_weight_animal ON weight_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_weight_changed ON weight_records(_changed);

CREATE TABLE IF NOT EXISTS breeding_records (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  bull_id TEXT REFERENCES animals(id),
  breeding_date TIMESTAMPTZ NOT NULL,
  method TEXT NOT NULL,
  expected_calving_date TIMESTAMPTZ,
  actual_calving_date TIMESTAMPTZ,
  calf_id TEXT REFERENCES animals(id),
  outcome TEXT NOT NULL,
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  photos TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_breeding_org ON breeding_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_breeding_animal ON breeding_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_breeding_changed ON breeding_records(_changed);

CREATE TABLE IF NOT EXISTS pasture_movements (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pasture_id TEXT NOT NULL REFERENCES pastures(id) ON DELETE CASCADE,
  animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  movement_date TIMESTAMPTZ NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('move_in', 'move_out')),
  moved_by TEXT,
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_movements_org ON pasture_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_movements_pasture ON pasture_movements(pasture_id);
CREATE INDEX IF NOT EXISTS idx_movements_animal ON pasture_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_movements_changed ON pasture_movements(_changed);

-- ===========================================================================
-- HELPER FUNCTIONS (to avoid RLS recursion)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(org_id TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = org_id
      AND memberships.user_id = is_org_member.user_id
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = org_id
      AND memberships.user_id = is_org_admin.user_id
      AND role = 'admin'
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.accept_invite(invite_code_param TEXT)
RETURNS JSONB AS $$
DECLARE
  invite_record RECORD;
  new_membership_id TEXT;
BEGIN
  SELECT * INTO invite_record
  FROM public.invites
  WHERE invite_code = invite_code_param
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid or expired invite code');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = invite_record.organization_id
      AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'You are already a member of this organization');
  END IF;

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
    NOW(),
    TRUE
  ) RETURNING id INTO new_membership_id;

  UPDATE public.invites
  SET accepted_at = NOW()
  WHERE id = invite_record.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'organization_id', invite_record.organization_id,
    'membership_id', new_membership_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user email from auth.users
  INSERT INTO public.memberships (
    user_id,
    organization_id,
    user_email,
    user_display_name,
    role,
    joined_at,
    is_active
  )
  SELECT
    auth.uid(),
    NEW.id,
    email,
    raw_user_meta_data->>'display_name',
    'admin',
    NOW(),
    TRUE
  FROM auth.users
  WHERE id = auth.uid();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- TRIGGERS
-- ===========================================================================

DROP TRIGGER IF EXISTS org_auto_membership ON organizations;
CREATE TRIGGER org_auto_membership
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_org_owner();

CREATE TRIGGER invites_updated_at BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastures ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasture_movements ENABLE ROW LEVEL SECURITY;

-- Organizations
DROP POLICY IF EXISTS "Members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;

-- Allow viewing orgs you're a member of OR that you just created
CREATE POLICY "Members can view organizations"
  ON organizations FOR SELECT
  USING (
    public.is_org_member(id) OR
    created_at > NOW() - INTERVAL '10 seconds'  -- Allow viewing newly created orgs briefly
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can update organizations"
  ON organizations FOR UPDATE
  USING (public.is_org_admin(id));

-- Memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can view org memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can delete memberships" ON memberships;
DROP POLICY IF EXISTS "System can insert memberships" ON memberships;

CREATE POLICY "Users can view own memberships"
  ON memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view org memberships"
  ON memberships FOR SELECT
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update memberships"
  ON memberships FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete memberships"
  ON memberships FOR DELETE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "System can insert memberships"
  ON memberships FOR INSERT
  WITH CHECK (TRUE);

-- Invites
DROP POLICY IF EXISTS "Admins can view org invites" ON invites;
DROP POLICY IF EXISTS "Users can view invites by code" ON invites;
DROP POLICY IF EXISTS "Admins can create invites" ON invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON invites;
DROP POLICY IF EXISTS "Users can accept invites" ON invites;

CREATE POLICY "Admins can view org invites"
  ON invites FOR SELECT
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Users can view invites by code"
  ON invites FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can create invites"
  ON invites FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete invites"
  ON invites FOR DELETE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Users can accept invites"
  ON invites FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- Pastures
DROP POLICY IF EXISTS "Members can view pastures" ON pastures;
DROP POLICY IF EXISTS "Members can manage pastures" ON pastures;

CREATE POLICY "Members can view pastures"
  ON pastures FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can manage pastures"
  ON pastures FOR ALL
  USING (public.is_org_member(organization_id));

-- Animals
DROP POLICY IF EXISTS "Members can view animals" ON animals;
DROP POLICY IF EXISTS "Members can manage animals" ON animals;

CREATE POLICY "Members can view animals"
  ON animals FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can manage animals"
  ON animals FOR ALL
  USING (public.is_org_member(organization_id));

-- Treatment Protocols
DROP POLICY IF EXISTS "Members can view protocols" ON treatment_protocols;
DROP POLICY IF EXISTS "Members can manage protocols" ON treatment_protocols;

CREATE POLICY "Members can view protocols"
  ON treatment_protocols FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can manage protocols"
  ON treatment_protocols FOR ALL
  USING (public.is_org_member(organization_id));

-- Health Records
DROP POLICY IF EXISTS "Members can view health records" ON health_records;
DROP POLICY IF EXISTS "Members can manage health records" ON health_records;

CREATE POLICY "Members can view health records"
  ON health_records FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can manage health records"
  ON health_records FOR ALL
  USING (public.is_org_member(organization_id));

-- Weight Records
DROP POLICY IF EXISTS "Members can view weight records" ON weight_records;
DROP POLICY IF EXISTS "Members can manage weight records" ON weight_records;

CREATE POLICY "Members can view weight records"
  ON weight_records FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can manage weight records"
  ON weight_records FOR ALL
  USING (public.is_org_member(organization_id));

-- Breeding Records
DROP POLICY IF EXISTS "Members can view breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Members can manage breeding records" ON breeding_records;

CREATE POLICY "Members can view breeding records"
  ON breeding_records FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can manage breeding records"
  ON breeding_records FOR ALL
  USING (public.is_org_member(organization_id));

-- Pasture Movements
DROP POLICY IF EXISTS "Members can view movements" ON pasture_movements;
DROP POLICY IF EXISTS "Members can manage movements" ON pasture_movements;

CREATE POLICY "Members can view movements"
  ON pasture_movements FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can manage movements"
  ON pasture_movements FOR ALL
  USING (public.is_org_member(organization_id));

-- ===========================================================================
-- SUCCESS!
-- ===========================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ HerdTrackr schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables: organizations, memberships, invites, pastures, animals,';
  RAISE NOTICE '        treatment_protocols, health_records, weight_records,';
  RAISE NOTICE '        breeding_records, pasture_movements';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS: Non-recursive policies using helper functions';
  RAISE NOTICE 'Triggers: Auto-add owner as admin when org created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to sync!';
END $$;
