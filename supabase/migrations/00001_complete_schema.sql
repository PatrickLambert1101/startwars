-- Complete HerdTrackr Schema
-- Version: 1 (Fresh Start)
-- Created: 2026-03-09
-- Includes: Base tables, user tracking, photos, WatermelonDB sync

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  name TEXT NOT NULL,
  livestock_types TEXT NOT NULL, -- JSON array
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_organizations_remote_id ON organizations(remote_id);
CREATE INDEX idx_organizations_changed ON organizations(_changed);

-- ============================================================================
-- MEMBERSHIPS TABLE (User-Organization link)
-- ============================================================================
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _changed TEXT,
  _status TEXT,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_memberships_org ON memberships(organization_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_changed ON memberships(_changed);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE (for team management)
-- ============================================================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ============================================================================
-- PASTURES TABLE
-- ============================================================================
CREATE TABLE pastures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
  photos TEXT, -- JSON array of photo objects
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_pastures_org ON pastures(organization_id);
CREATE INDEX idx_pastures_changed ON pastures(_changed);

-- ============================================================================
-- ANIMALS TABLE
-- ============================================================================
CREATE TABLE animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  rfid_tag TEXT NOT NULL,
  visual_tag TEXT NOT NULL,
  name TEXT,
  breed TEXT NOT NULL,
  sex TEXT NOT NULL,
  date_of_birth TIMESTAMPTZ,
  sire_id UUID REFERENCES animals(id),
  dam_id UUID REFERENCES animals(id),
  registration_number TEXT,
  current_pasture_id UUID REFERENCES pastures(id),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  photos TEXT, -- JSON array of photo objects
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_animals_org ON animals(organization_id);
CREATE INDEX idx_animals_rfid ON animals(rfid_tag);
CREATE INDEX idx_animals_pasture ON animals(current_pasture_id);
CREATE INDEX idx_animals_changed ON animals(_changed);

-- ============================================================================
-- TREATMENT PROTOCOLS TABLE
-- ============================================================================
CREATE TABLE treatment_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_protocols_org ON treatment_protocols(organization_id);
CREATE INDEX idx_protocols_changed ON treatment_protocols(_changed);

-- ============================================================================
-- HEALTH RECORDS TABLE
-- ============================================================================
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES treatment_protocols(id),
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
  photos TEXT, -- JSON array of photo objects
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_health_org ON health_records(organization_id);
CREATE INDEX idx_health_animal ON health_records(animal_id);
CREATE INDEX idx_health_protocol ON health_records(protocol_id);
CREATE INDEX idx_health_changed ON health_records(_changed);

-- ============================================================================
-- WEIGHT RECORDS TABLE
-- ============================================================================
CREATE TABLE weight_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  record_date TIMESTAMPTZ NOT NULL,
  weight_kg NUMERIC NOT NULL,
  condition_score INTEGER CHECK (condition_score >= 1 AND condition_score <= 9),
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  photos TEXT, -- JSON array of photo objects
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_weight_org ON weight_records(organization_id);
CREATE INDEX idx_weight_animal ON weight_records(animal_id);
CREATE INDEX idx_weight_changed ON weight_records(_changed);

-- ============================================================================
-- BREEDING RECORDS TABLE
-- ============================================================================
CREATE TABLE breeding_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  bull_id UUID REFERENCES animals(id),
  breeding_date TIMESTAMPTZ NOT NULL,
  method TEXT NOT NULL,
  expected_calving_date TIMESTAMPTZ,
  actual_calving_date TIMESTAMPTZ,
  calf_id UUID REFERENCES animals(id),
  outcome TEXT NOT NULL,
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  photos TEXT, -- JSON array of photo objects
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_breeding_org ON breeding_records(organization_id);
CREATE INDEX idx_breeding_animal ON breeding_records(animal_id);
CREATE INDEX idx_breeding_changed ON breeding_records(_changed);

-- ============================================================================
-- PASTURE MOVEMENTS TABLE
-- ============================================================================
CREATE TABLE pasture_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pasture_id UUID NOT NULL REFERENCES pastures(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  movement_date TIMESTAMPTZ NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('move_in', 'move_out')),
  moved_by TEXT,
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT,
  _status TEXT
);

CREATE INDEX idx_movements_org ON pasture_movements(organization_id);
CREATE INDEX idx_movements_pasture ON pasture_movements(pasture_id);
CREATE INDEX idx_movements_animal ON pasture_movements(animal_id);
CREATE INDEX idx_movements_changed ON pasture_movements(_changed);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastures ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasture_movements ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see orgs they're members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update their organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Memberships: Users can see memberships for their orgs
CREATE POLICY "Users can view memberships in their orgs"
  ON memberships FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create memberships"
  ON memberships FOR INSERT
  WITH CHECK (true);

-- Organization Members: Same as memberships
CREATE POLICY "Users can view members in their orgs"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Pastures: Members can view, admins can modify
CREATE POLICY "Members can view pastures"
  ON pastures FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create pastures"
  ON pastures FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update pastures"
  ON pastures FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Animals: Members can view and create
CREATE POLICY "Members can view animals"
  ON animals FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create animals"
  ON animals FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update animals"
  ON animals FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Treatment Protocols: Members can view and create
CREATE POLICY "Members can view protocols"
  ON treatment_protocols FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create protocols"
  ON treatment_protocols FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update protocols"
  ON treatment_protocols FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Health Records: Members can view and create
CREATE POLICY "Members can view health records"
  ON health_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create health records"
  ON health_records FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update health records"
  ON health_records FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Weight Records: Members can view and create
CREATE POLICY "Members can view weight records"
  ON weight_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create weight records"
  ON weight_records FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update weight records"
  ON weight_records FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Breeding Records: Members can view and create
CREATE POLICY "Members can view breeding records"
  ON breeding_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create breeding records"
  ON breeding_records FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update breeding records"
  ON breeding_records FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Pasture Movements: Members can view and create
CREATE POLICY "Members can view movements"
  ON pasture_movements FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create movements"
  ON pasture_movements FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Complete schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - organizations';
  RAISE NOTICE '  - memberships';
  RAISE NOTICE '  - organization_members';
  RAISE NOTICE '  - pastures';
  RAISE NOTICE '  - animals';
  RAISE NOTICE '  - treatment_protocols';
  RAISE NOTICE '  - health_records (with user tracking + photos)';
  RAISE NOTICE '  - weight_records (with user tracking + photos)';
  RAISE NOTICE '  - breeding_records (with user tracking + photos)';
  RAISE NOTICE '  - pasture_movements (with user tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '  ✓ User tracking (created_by_user_id, created_by_name)';
  RAISE NOTICE '  ✓ Photo support (photos column)';
  RAISE NOTICE '  ✓ WatermelonDB sync (_changed, _status)';
  RAISE NOTICE '  ✓ Row Level Security (RLS)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create Supabase Storage bucket "herdtrackr-photos"';
  RAISE NOTICE '  2. Set up storage RLS policies (see PHOTO_STORAGE_SETUP.md)';
  RAISE NOTICE '  3. Restart your app with clean database';
END $$;
