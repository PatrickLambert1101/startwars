-- ===========================================================================
-- HERDTRACKR BASELINE SCHEMA
-- Consolidated migration combining base schema + all later additions
-- ===========================================================================

-- ===========================================================================
-- SECTION 1: EXTENSIONS
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================================================
-- SECTION 2: TABLES
-- ===========================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  name TEXT NOT NULL,
  livestock_types TEXT,
  location TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter','farm','commercial')),
  subscription_starts_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active','cancelled','expired','trial')),
  default_breeds JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

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
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created',
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invite_code TEXT UNIQUE NOT NULL,
  invite_method TEXT DEFAULT 'email' CHECK (invite_method IN ('email','sms','whatsapp')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

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

CREATE TABLE IF NOT EXISTS vaccination_schedules (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  protocol_id TEXT NOT NULL REFERENCES treatment_protocols(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL,
  target_age_months INTEGER,
  age_window_days INTEGER,
  scheduled_date TIMESTAMPTZ,
  repeat_annually BOOLEAN NOT NULL DEFAULT FALSE,
  pasture_id TEXT REFERENCES pastures(id),
  interval_months INTEGER,
  last_applied_date TIMESTAMPTZ,
  target_species TEXT,
  target_sex TEXT,
  min_age_months INTEGER,
  max_age_months INTEGER,
  requires_booster BOOLEAN NOT NULL DEFAULT FALSE,
  booster_interval_days INTEGER,
  booster_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE TABLE IF NOT EXISTS scheduled_vaccinations (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES vaccination_schedules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ NOT NULL,
  administered_date TIMESTAMPTZ,
  skipped_reason TEXT,
  health_record_id TEXT REFERENCES health_records(id),
  dose_number INTEGER NOT NULL DEFAULT 1,
  parent_vaccination_id TEXT REFERENCES scheduled_vaccinations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE TABLE IF NOT EXISTS super_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by text,
    granted_at timestamptz DEFAULT now(),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ===========================================================================
-- SECTION 3: INDEXES
-- ===========================================================================

-- Indexes on organizations
CREATE INDEX IF NOT EXISTS idx_organizations_remote_id ON organizations(remote_id);
CREATE INDEX IF NOT EXISTS idx_organizations_changed ON organizations(_changed);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);

-- Indexes on memberships
CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_changed ON memberships(_changed);
CREATE INDEX IF NOT EXISTS idx_memberships_is_deleted ON memberships(is_deleted);

-- Indexes on invites
CREATE INDEX IF NOT EXISTS idx_invites_org ON invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_phone ON invites(phone);

-- Indexes on pastures
CREATE INDEX IF NOT EXISTS idx_pastures_org ON pastures(organization_id);
CREATE INDEX IF NOT EXISTS idx_pastures_changed ON pastures(_changed);

-- Indexes on animals
CREATE INDEX IF NOT EXISTS idx_animals_org ON animals(organization_id);
CREATE INDEX IF NOT EXISTS idx_animals_rfid ON animals(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_animals_visual ON animals(visual_tag);
CREATE INDEX IF NOT EXISTS idx_animals_herd_tag ON animals(herd_tag);
CREATE INDEX IF NOT EXISTS idx_animals_pasture ON animals(current_pasture_id);
CREATE INDEX IF NOT EXISTS idx_animals_changed ON animals(_changed);

-- Indexes on treatment_protocols
CREATE INDEX IF NOT EXISTS idx_protocols_org ON treatment_protocols(organization_id);
CREATE INDEX IF NOT EXISTS idx_protocols_changed ON treatment_protocols(_changed);

-- Indexes on health_records
CREATE INDEX IF NOT EXISTS idx_health_org ON health_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_health_animal ON health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_protocol ON health_records(protocol_id);
CREATE INDEX IF NOT EXISTS idx_health_changed ON health_records(_changed);

-- Indexes on weight_records
CREATE INDEX IF NOT EXISTS idx_weight_org ON weight_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_weight_animal ON weight_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_weight_changed ON weight_records(_changed);

-- Indexes on breeding_records
CREATE INDEX IF NOT EXISTS idx_breeding_org ON breeding_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_breeding_animal ON breeding_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_breeding_changed ON breeding_records(_changed);

-- Indexes on pasture_movements
CREATE INDEX IF NOT EXISTS idx_movements_org ON pasture_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_movements_pasture ON pasture_movements(pasture_id);
CREATE INDEX IF NOT EXISTS idx_movements_animal ON pasture_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_movements_changed ON pasture_movements(_changed);

-- Indexes on vaccination_schedules
CREATE INDEX IF NOT EXISTS idx_vacc_schedules_org ON vaccination_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_vacc_schedules_protocol ON vaccination_schedules(protocol_id);
CREATE INDEX IF NOT EXISTS idx_vacc_schedules_changed ON vaccination_schedules(_changed);
CREATE INDEX IF NOT EXISTS idx_vacc_schedules_type ON vaccination_schedules(schedule_type);

-- Indexes on scheduled_vaccinations
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_org ON scheduled_vaccinations(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_animal ON scheduled_vaccinations(animal_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_schedule ON scheduled_vaccinations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_status ON scheduled_vaccinations(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_due_date ON scheduled_vaccinations(due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_changed ON scheduled_vaccinations(_changed);

-- Indexes on super_users
CREATE INDEX IF NOT EXISTS idx_super_users_email ON super_users(email);
CREATE INDEX IF NOT EXISTS idx_super_users_user_id ON super_users(user_id);
CREATE INDEX IF NOT EXISTS idx_super_users_is_active ON super_users(is_active);

-- ===========================================================================
-- SECTION 4: FUNCTIONS
-- ===========================================================================

-- Helper functions for RLS (non-recursive)
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


CREATE OR REPLACE FUNCTION public.accept_invite(invite_code_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.add_super_user(user_email text, admin_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    new_id uuid;
    target_user_id uuid;
BEGIN
    -- Try to find the user ID from auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;

    -- Insert or update super user record
    INSERT INTO super_users (email, user_id, granted_by, notes, is_active)
    VALUES (
        user_email,
        target_user_id,
        COALESCE(auth.jwt()->>'email', 'system'),
        admin_notes,
        true
    )
    ON CONFLICT (email)
    DO UPDATE SET
        is_active = true,
        user_id = COALESCE(EXCLUDED.user_id, super_users.user_id),
        notes = COALESCE(EXCLUDED.notes, super_users.notes),
        granted_by = COALESCE(auth.jwt()->>'email', 'system'),
        granted_at = now(),
        updated_at = now()
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Skip if being called from sync_push (check if id already provided by sync)
  IF EXISTS (
    SELECT 1 FROM pg_stat_activity
    WHERE query LIKE '%sync_push%'
    AND pid = pg_backend_pid()
  ) THEN
    RETURN NEW;
  END IF;

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
  WHERE id = auth.uid()
  ON CONFLICT (id) DO NOTHING;  -- Ignore if membership already exists

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.epoch_to_timestamp(epoch bigint)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN to_timestamp(epoch / 1000.0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..7 LOOP
    result := result || floor(random() * 10)::text;
  END LOOP;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_super_user(check_user_id uuid DEFAULT NULL::uuid, check_email text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    user_email text;
    user_uuid uuid;
BEGIN
    -- Get current user info if not provided
    IF check_user_id IS NULL THEN
        check_user_id := auth.uid();
    END IF;

    IF check_email IS NULL THEN
        check_email := auth.jwt()->>'email';
    END IF;

    -- Check if user is a super user
    RETURN EXISTS (
        SELECT 1
        FROM super_users
        WHERE is_active = true
        AND (
            user_id = check_user_id
            OR email = check_email
        )
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_pull(last_pulled_at bigint DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '60s'
AS $function$
DECLARE
  timestamp_now BIGINT;
  since_timestamp TIMESTAMPTZ;
  changes JSONB := '{}'::jsonb;
  created_records JSONB;
  updated_records JSONB;
  deleted_ids JSONB;
  user_org_ids TEXT[];  -- Use TEXT instead of UUID to avoid type issues
  current_user_id UUID;
BEGIN
  timestamp_now := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := to_timestamp(last_pulled_at / 1000.0);
  current_user_id := auth.uid();

  -- Get user's organizations as TEXT array
  SELECT ARRAY_AGG(DISTINCT organization_id::TEXT) INTO user_org_ids
  FROM memberships
  WHERE user_id = current_user_id AND is_deleted = false AND is_active = true;

  IF user_org_ids IS NULL OR array_length(user_org_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'changes', jsonb_build_object(
        'organizations', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'memberships', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pastures', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'animals', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'treatment_protocols', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'health_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'weight_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'breeding_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pasture_movements', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'vaccination_schedules', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'scheduled_vaccinations', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb)
      ),
      'timestamp', timestamp_now
    );
  END IF;

  -- Organizations (compare id::TEXT)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM organizations WHERE created_at > since_timestamp AND is_deleted = false AND id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM organizations WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM organizations WHERE updated_at > since_timestamp AND is_deleted = true AND id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM organizations WHERE is_deleted = false AND id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('organizations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Memberships
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM memberships WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM memberships WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM memberships WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM memberships WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('memberships', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Pastures
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM pastures WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM pastures WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM pastures WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM pastures WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('pastures', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Animals (WITH date_of_birth AND TEXT comparison)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM animals WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM animals WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM animals WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    -- FULL SYNC: Return ALL animals for user's organizations WITH date_of_birth
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM animals WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('animals', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Treatment Protocols (simplified - only essential columns)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM treatment_protocols t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM treatment_protocols t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM treatment_protocols WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM treatment_protocols t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('treatment_protocols', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Health Records, Weight Records, Breeding Records, Pasture Movements (using row_to_json for brevity)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM health_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM health_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM health_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM health_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('health_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM weight_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM weight_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM weight_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM weight_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('weight_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM breeding_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM breeding_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM breeding_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM breeding_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('breeding_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM pasture_movements t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM pasture_movements t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM pasture_movements WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM pasture_movements t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('pasture_movements', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM vaccination_schedules t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM vaccination_schedules t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM vaccination_schedules WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM vaccination_schedules t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('vaccination_schedules', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations t WHERE created_at > since_timestamp AND is_deleted = false AND animal_id IN (SELECT id FROM animals WHERE organization_id::TEXT = ANY(user_org_ids));
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM scheduled_vaccinations t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND animal_id IN (SELECT id FROM animals WHERE organization_id::TEXT = ANY(user_org_ids));
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM scheduled_vaccinations WHERE updated_at > since_timestamp AND is_deleted = true AND animal_id IN (SELECT id FROM animals WHERE organization_id::TEXT = ANY(user_org_ids));
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations t WHERE is_deleted = false AND animal_id IN (SELECT id FROM animals WHERE organization_id::TEXT = ANY(user_org_ids));
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('scheduled_vaccinations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Return all changes with timestamp
  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_push(changes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  record JSONB;
  error_count INT := 0;
  errors JSONB := '[]'::jsonb;
BEGIN
  -- Process organizations - FIXED: Added all missing columns
  IF changes ? 'organizations' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organizations'->'created', '[]'::jsonb) || COALESCE(changes->'organizations'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO organizations (id, name, livestock_types, location, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'name'),
          (record->>'livestock_types'),
          (record->>'location'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          livestock_types = EXCLUDED.livestock_types,
          location = EXCLUDED.location,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'organizations', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process organization_members (memberships) - FIXED: Added invited_by and is_deleted
  IF changes ? 'organization_members' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organization_members'->'created', '[]'::jsonb) || COALESCE(changes->'organization_members'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO memberships (id, organization_id, user_id, user_email, user_display_name, role, invited_by, invited_at, joined_at, is_active, created_at, updated_at, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'user_id'),
          (record->>'user_email'),
          (record->>'user_display_name'),
          (record->>'role'),
          (record->>'invited_by')::uuid,
          (record->>'invited_at')::timestamptz,
          (record->>'joined_at')::timestamptz,
          COALESCE((record->>'is_active')::boolean, true),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          user_id = EXCLUDED.user_id,
          user_email = EXCLUDED.user_email,
          user_display_name = EXCLUDED.user_display_name,
          role = EXCLUDED.role,
          invited_by = EXCLUDED.invited_by,
          updated_at = EXCLUDED.updated_at;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'memberships', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process pastures - FIXED: All columns match WatermelonDB schema
  IF changes ? 'pastures' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'pastures'->'created', '[]'::jsonb) || COALESCE(changes->'pastures'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO pastures (id, organization_id, name, code, size_hectares, location_notes, forage_type, water_source, fence_type, has_salt_blocks, has_mineral_feeders, max_capacity, target_grazing_days, target_rest_days, current_animal_count, last_grazed_date, available_from_date, is_active, notes, photos, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'name'),
          (record->>'code'),
          (record->>'size_hectares')::numeric,
          (record->>'location_notes'),
          (record->>'forage_type'),
          (record->>'water_source'),
          (record->>'fence_type'),
          (record->>'has_salt_blocks')::boolean,
          (record->>'has_mineral_feeders')::boolean,
          (record->>'max_capacity')::integer,
          (record->>'target_grazing_days')::integer,
          (record->>'target_rest_days')::integer,
          (record->>'current_animal_count')::integer,
          (record->>'last_grazed_date')::timestamptz,
          (record->>'available_from_date')::timestamptz,
          COALESCE((record->>'is_active')::boolean, true),
          (record->>'notes'),
          (record->>'photos'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          size_hectares = EXCLUDED.size_hectares,
          location_notes = EXCLUDED.location_notes,
          forage_type = EXCLUDED.forage_type,
          water_source = EXCLUDED.water_source,
          fence_type = EXCLUDED.fence_type,
          has_salt_blocks = EXCLUDED.has_salt_blocks,
          has_mineral_feeders = EXCLUDED.has_mineral_feeders,
          max_capacity = EXCLUDED.max_capacity,
          target_grazing_days = EXCLUDED.target_grazing_days,
          target_rest_days = EXCLUDED.target_rest_days,
          current_animal_count = EXCLUDED.current_animal_count,
          last_grazed_date = EXCLUDED.last_grazed_date,
          available_from_date = EXCLUDED.available_from_date,
          is_active = EXCLUDED.is_active,
          notes = EXCLUDED.notes,
          photos = EXCLUDED.photos,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'pastures', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process animals - Already fixed in previous migration
  IF changes ? 'animals' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'animals'->'created', '[]'::jsonb) || COALESCE(changes->'animals'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO animals (id, organization_id, species, name, visual_tag, rfid_tag, breed, sex, date_of_birth, status, dam_id, sire_id, registration_number, current_pasture_id, herd_tag, notes, photos, tags, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'species'),
          (record->>'name'),
          (record->>'visual_tag'),
          (record->>'rfid_tag'),
          (record->>'breed'),
          (record->>'sex'),
          (record->>'date_of_birth')::timestamptz,
          (record->>'status'),
          (record->>'dam_id'),
          (record->>'sire_id'),
          (record->>'registration_number'),
          (record->>'current_pasture_id'),
          (record->>'herd_tag'),
          (record->>'notes'),
          (record->>'photos'),
          (record->>'tags'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          species = EXCLUDED.species,
          name = EXCLUDED.name,
          visual_tag = EXCLUDED.visual_tag,
          rfid_tag = EXCLUDED.rfid_tag,
          breed = EXCLUDED.breed,
          sex = EXCLUDED.sex,
          date_of_birth = EXCLUDED.date_of_birth,
          status = EXCLUDED.status,
          dam_id = EXCLUDED.dam_id,
          sire_id = EXCLUDED.sire_id,
          registration_number = EXCLUDED.registration_number,
          current_pasture_id = EXCLUDED.current_pasture_id,
          herd_tag = EXCLUDED.herd_tag,
          notes = EXCLUDED.notes,
          photos = EXCLUDED.photos,
          tags = EXCLUDED.tags,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'animals', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process treatment_protocols - FIXED: Correct column names and all fields
  IF changes ? 'treatment_protocols' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'treatment_protocols'->'created', '[]'::jsonb) || COALESCE(changes->'treatment_protocols'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO treatment_protocols (id, organization_id, name, description, protocol_type, product_name, dosage, administration_method, withdrawal_days, target_species, target_age_min, target_age_max, is_active, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'name'),
          (record->>'description'),
          (record->>'protocol_type'),
          (record->>'product_name'),
          (record->>'dosage'),
          (record->>'administration_method'),
          (record->>'withdrawal_days')::integer,
          (record->>'target_species'),
          (record->>'target_age_min')::integer,
          (record->>'target_age_max')::integer,
          COALESCE((record->>'is_active')::boolean, true),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          protocol_type = EXCLUDED.protocol_type,
          product_name = EXCLUDED.product_name,
          dosage = EXCLUDED.dosage,
          administration_method = EXCLUDED.administration_method,
          withdrawal_days = EXCLUDED.withdrawal_days,
          target_species = EXCLUDED.target_species,
          target_age_min = EXCLUDED.target_age_min,
          target_age_max = EXCLUDED.target_age_max,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'treatment_protocols', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process health_records - FIXED: Correct column names (protocol_id, record_date, dosage, etc.)
  IF changes ? 'health_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'health_records'->'created', '[]'::jsonb) || COALESCE(changes->'health_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO health_records (id, organization_id, animal_id, protocol_id, record_date, record_type, description, product_name, dosage, administered_by, withdrawal_date, notes, created_by_user_id, created_by_name, photos, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'animal_id'),
          (record->>'protocol_id'),
          (record->>'record_date')::timestamptz,
          (record->>'record_type'),
          (record->>'description'),
          (record->>'product_name'),
          (record->>'dosage'),
          (record->>'administered_by'),
          (record->>'withdrawal_date')::timestamptz,
          (record->>'notes'),
          (record->>'created_by_user_id'),
          (record->>'created_by_name'),
          (record->>'photos'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          protocol_id = EXCLUDED.protocol_id,
          record_date = EXCLUDED.record_date,
          record_type = EXCLUDED.record_type,
          description = EXCLUDED.description,
          product_name = EXCLUDED.product_name,
          dosage = EXCLUDED.dosage,
          administered_by = EXCLUDED.administered_by,
          withdrawal_date = EXCLUDED.withdrawal_date,
          notes = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name = EXCLUDED.created_by_name,
          photos = EXCLUDED.photos,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'health_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process weight_records - FIXED: Correct column name (record_date not measurement_date)
  IF changes ? 'weight_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'weight_records'->'created', '[]'::jsonb) || COALESCE(changes->'weight_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO weight_records (id, organization_id, animal_id, record_date, weight_kg, condition_score, notes, created_by_user_id, created_by_name, photos, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'animal_id'),
          (record->>'record_date')::timestamptz,
          (record->>'weight_kg')::numeric,
          (record->>'condition_score')::integer,
          (record->>'notes'),
          (record->>'created_by_user_id'),
          (record->>'created_by_name'),
          (record->>'photos'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          record_date = EXCLUDED.record_date,
          weight_kg = EXCLUDED.weight_kg,
          condition_score = EXCLUDED.condition_score,
          notes = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name = EXCLUDED.created_by_name,
          photos = EXCLUDED.photos,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'weight_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process breeding_records - FIXED: Correct column names (animal_id, bull_id, method)
  IF changes ? 'breeding_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'breeding_records'->'created', '[]'::jsonb) || COALESCE(changes->'breeding_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO breeding_records (id, organization_id, animal_id, bull_id, breeding_date, method, expected_calving_date, actual_calving_date, calf_id, outcome, notes, created_by_user_id, created_by_name, photos, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'animal_id'),
          (record->>'bull_id'),
          (record->>'breeding_date')::timestamptz,
          (record->>'method'),
          (record->>'expected_calving_date')::timestamptz,
          (record->>'actual_calving_date')::timestamptz,
          (record->>'calf_id'),
          (record->>'outcome'),
          (record->>'notes'),
          (record->>'created_by_user_id'),
          (record->>'created_by_name'),
          (record->>'photos'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          animal_id = EXCLUDED.animal_id,
          bull_id = EXCLUDED.bull_id,
          breeding_date = EXCLUDED.breeding_date,
          method = EXCLUDED.method,
          expected_calving_date = EXCLUDED.expected_calving_date,
          actual_calving_date = EXCLUDED.actual_calving_date,
          calf_id = EXCLUDED.calf_id,
          outcome = EXCLUDED.outcome,
          notes = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name = EXCLUDED.created_by_name,
          photos = EXCLUDED.photos,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'breeding_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process pasture_movements - FIXED: Correct schema (pasture_id, movement_type, moved_by)
  IF changes ? 'pasture_movements' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'pasture_movements'->'created', '[]'::jsonb) || COALESCE(changes->'pasture_movements'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO pasture_movements (id, organization_id, pasture_id, animal_id, movement_date, movement_type, moved_by, notes, created_by_user_id, created_by_name, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'pasture_id'),
          (record->>'animal_id'),
          (record->>'movement_date')::timestamptz,
          (record->>'movement_type'),
          (record->>'moved_by'),
          (record->>'notes'),
          (record->>'created_by_user_id'),
          (record->>'created_by_name'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          pasture_id = EXCLUDED.pasture_id,
          movement_date = EXCLUDED.movement_date,
          movement_type = EXCLUDED.movement_type,
          moved_by = EXCLUDED.moved_by,
          notes = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name = EXCLUDED.created_by_name,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'pasture_movements', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  IF error_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error_count', error_count, 'errors', errors);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_push_changes(changes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  record jsonb;
  result jsonb := '{"success": true, "errors": [], "error_count": 0}'::jsonb;
  error_array jsonb := '[]'::jsonb;
BEGIN
  -- Get current user's auth ID
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated',
      'errors', '[]'::jsonb,
      'error_count', 0
    );
  END IF;

  -- Process organizations
  IF changes ? 'organizations' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organizations'->'created', '[]'::jsonb) || COALESCE(changes->'organizations'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO organizations (id, name, livestock_types, location, default_breeds, subscription_tier, subscription_status, subscription_starts_at, subscription_ends_at, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'name'),
          (record->>'livestock_types'),
          (record->>'location'),
          (record->>'default_breeds'),
          COALESCE((record->>'subscription_tier'), 'starter'),
          (record->>'subscription_status'),
          (record->>'subscription_starts_at')::timestamptz,
          (record->>'subscription_ends_at')::timestamptz,
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          livestock_types = EXCLUDED.livestock_types,
          location = EXCLUDED.location,
          default_breeds = EXCLUDED.default_breeds,
          subscription_tier = EXCLUDED.subscription_tier,
          subscription_status = EXCLUDED.subscription_status,
          subscription_starts_at = EXCLUDED.subscription_starts_at,
          subscription_ends_at = EXCLUDED.subscription_ends_at,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_array := error_array || jsonb_build_object('table', 'organizations', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process animals - FIX: Use rfid_tag instead of electronic_tag
  IF changes ? 'animals' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'animals'->'created', '[]'::jsonb) || COALESCE(changes->'animals'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO animals (id, organization_id, name, species, visual_tag, rfid_tag, breed, sex, date_of_birth, status, dam_id, sire_id, current_pasture_id, herd_tag, registration_number, notes, photos, tags, genetic_traits, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'name'),
          (record->>'species'),
          (record->>'visual_tag'),
          (record->>'rfid_tag'),
          (record->>'breed'),
          (record->>'sex'),
          (record->>'date_of_birth')::timestamptz,
          (record->>'status'),
          (record->>'dam_id'),
          (record->>'sire_id'),
          (record->>'current_pasture_id'),
          (record->>'herd_tag'),
          (record->>'registration_number'),
          (record->>'notes'),
          (record->>'photos'),
          (record->>'tags'),
          (record->>'genetic_traits'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          species = EXCLUDED.species,
          visual_tag = EXCLUDED.visual_tag,
          rfid_tag = EXCLUDED.rfid_tag,
          breed = EXCLUDED.breed,
          sex = EXCLUDED.sex,
          date_of_birth = EXCLUDED.date_of_birth,
          status = EXCLUDED.status,
          dam_id = EXCLUDED.dam_id,
          sire_id = EXCLUDED.sire_id,
          current_pasture_id = EXCLUDED.current_pasture_id,
          herd_tag = EXCLUDED.herd_tag,
          registration_number = EXCLUDED.registration_number,
          notes = EXCLUDED.notes,
          photos = EXCLUDED.photos,
          tags = EXCLUDED.tags,
          genetic_traits = EXCLUDED.genetic_traits,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_array := error_array || jsonb_build_object('table', 'animals', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Build result
  result := jsonb_build_object(
    'success', jsonb_array_length(error_array) = 0,
    'errors', error_array,
    'error_count', jsonb_array_length(error_array)
  );

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.timestamp_to_epoch(ts timestamp with time zone)
 RETURNS bigint
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN CAST(EXTRACT(EPOCH FROM ts) * 1000 AS BIGINT);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_scheduled_vaccinations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_super_users_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vaccination_schedules_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ===========================================================================
-- SECTION 5: TRIGGERS
-- ===========================================================================

-- Triggers
CREATE TRIGGER invites_updated_at BEFORE UPDATE ON public.invites FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER org_auto_membership AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION auto_add_org_owner();
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER scheduled_vaccinations_updated_at BEFORE UPDATE ON public.scheduled_vaccinations FOR EACH ROW EXECUTE FUNCTION update_scheduled_vaccinations_updated_at();
CREATE TRIGGER set_super_users_updated_at BEFORE UPDATE ON public.super_users FOR EACH ROW EXECUTE FUNCTION update_super_users_updated_at();
CREATE TRIGGER vaccination_schedules_updated_at BEFORE UPDATE ON public.vaccination_schedules FOR EACH ROW EXECUTE FUNCTION update_vaccination_schedules_updated_at();

-- ===========================================================================
-- SECTION 6: ROW LEVEL SECURITY
-- ===========================================================================

-- Enable RLS on all public tables
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
ALTER TABLE vaccination_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_users ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING ((select auth.uid()) IS NOT NULL AND is_org_member(id));

CREATE POLICY "org_insert" ON organizations FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (is_org_admin(id));

CREATE POLICY "org_delete" ON organizations FOR DELETE
  USING (is_org_admin(id));

-- Memberships policies
CREATE POLICY "memberships_select" ON memberships FOR SELECT
  USING (user_id = (select auth.uid()) OR is_org_admin(organization_id));

CREATE POLICY "memberships_insert" ON memberships FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "memberships_update" ON memberships FOR UPDATE
  USING (is_org_admin(organization_id));

CREATE POLICY "memberships_delete" ON memberships FOR DELETE
  USING (is_org_admin(organization_id));

-- Invites policies
CREATE POLICY "invites_select" ON invites FOR SELECT
  USING (is_org_admin(organization_id));

CREATE POLICY "invites_insert" ON invites FOR INSERT TO authenticated
  WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "invites_update" ON invites FOR UPDATE TO authenticated
  USING (is_org_admin(organization_id));

CREATE POLICY "invites_delete" ON invites FOR DELETE TO authenticated
  USING (is_org_admin(organization_id));

-- Pastures policies (org members can do all)
CREATE POLICY "pastures_all" ON pastures FOR ALL
  USING (is_org_member(organization_id));

-- Animals policies (org members can do all)
CREATE POLICY "animals_all" ON animals FOR ALL
  USING (is_org_member(organization_id));

-- Treatment Protocols policies (org members can do all)
CREATE POLICY "protocols_all" ON treatment_protocols FOR ALL
  USING (is_org_member(organization_id));

-- Health Records policies (org members can do all)
CREATE POLICY "health_records_all" ON health_records FOR ALL
  USING (is_org_member(organization_id));

-- Weight Records policies (org members can do all)
CREATE POLICY "weight_records_all" ON weight_records FOR ALL
  USING (is_org_member(organization_id));

-- Breeding Records policies (org members can do all)
CREATE POLICY "breeding_records_all" ON breeding_records FOR ALL
  USING (is_org_member(organization_id));

-- Pasture Movements policies (org members can do all)
CREATE POLICY "movements_all" ON pasture_movements FOR ALL
  USING (is_org_member(organization_id));

-- Vaccination Schedules policies (org members can do all)
CREATE POLICY "vacc_schedules_all" ON vaccination_schedules FOR ALL
  USING (is_org_member(organization_id));

-- Scheduled Vaccinations policies (org members can do all)
CREATE POLICY "scheduled_vacc_all" ON scheduled_vaccinations FOR ALL
  USING (is_org_member(organization_id));

-- Super Users policies
CREATE POLICY "super_users_select" ON super_users FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR email = (auth.jwt() ->> 'email'))

-- ===========================================================================
-- SECTION 7: COLUMN COMMENTS
-- ===========================================================================

-- Column comments
COMMENT ON COLUMN animals.tags IS 'JSON array of tag strings';
COMMENT ON COLUMN invites.phone IS 'E.164 format';
