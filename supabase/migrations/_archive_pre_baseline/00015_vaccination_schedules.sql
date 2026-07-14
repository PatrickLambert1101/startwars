-- Add vaccination scheduling tables
-- This enables automated vaccination tracking based on age, date, or group-based schedules

-- Vaccination Schedules Table
CREATE TABLE IF NOT EXISTS vaccination_schedules (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  protocol_id TEXT NOT NULL REFERENCES treatment_protocols(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL, -- 'age_based', 'date_based', 'group_based'

  -- Age-based scheduling
  target_age_months INTEGER,
  age_window_days INTEGER,

  -- Date-based scheduling
  scheduled_date TIMESTAMPTZ,
  repeat_annually BOOLEAN NOT NULL DEFAULT FALSE,

  -- Group-based scheduling
  pasture_id TEXT REFERENCES pastures(id),
  interval_months INTEGER,
  last_applied_date TIMESTAMPTZ,

  -- Filters
  target_species TEXT,
  target_sex TEXT,
  min_age_months INTEGER,
  max_age_months INTEGER,

  -- Booster configuration
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

CREATE INDEX IF NOT EXISTS idx_vacc_schedules_org ON vaccination_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_vacc_schedules_protocol ON vaccination_schedules(protocol_id);
CREATE INDEX IF NOT EXISTS idx_vacc_schedules_changed ON vaccination_schedules(_changed);
CREATE INDEX IF NOT EXISTS idx_vacc_schedules_type ON vaccination_schedules(schedule_type);

-- Scheduled Vaccinations Table
CREATE TABLE IF NOT EXISTS scheduled_vaccinations (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES vaccination_schedules(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'administered', 'skipped', 'overdue'
  due_date TIMESTAMPTZ NOT NULL,
  administered_date TIMESTAMPTZ,
  skipped_reason TEXT,

  -- Link to health record when administered
  health_record_id TEXT REFERENCES health_records(id),

  -- Booster tracking
  dose_number INTEGER NOT NULL DEFAULT 1,
  parent_vaccination_id TEXT REFERENCES scheduled_vaccinations(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_org ON scheduled_vaccinations(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_animal ON scheduled_vaccinations(animal_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_schedule ON scheduled_vaccinations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_status ON scheduled_vaccinations(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_due_date ON scheduled_vaccinations(due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_vacc_changed ON scheduled_vaccinations(_changed);

-- Enable RLS
ALTER TABLE vaccination_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_vaccinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vaccination_schedules
CREATE POLICY "Users can view schedules in their organization"
  ON vaccination_schedules FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can insert schedules in their organization"
  ON vaccination_schedules FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can update schedules in their organization"
  ON vaccination_schedules FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can delete schedules in their organization"
  ON vaccination_schedules FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- RLS Policies for scheduled_vaccinations
CREATE POLICY "Users can view scheduled vaccinations in their organization"
  ON scheduled_vaccinations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can insert scheduled vaccinations in their organization"
  ON scheduled_vaccinations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can update scheduled vaccinations in their organization"
  ON scheduled_vaccinations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can delete scheduled vaccinations in their organization"
  ON scheduled_vaccinations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_vaccination_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vaccination_schedules_updated_at
  BEFORE UPDATE ON vaccination_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_vaccination_schedules_updated_at();

CREATE OR REPLACE FUNCTION update_scheduled_vaccinations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_vaccinations_updated_at
  BEFORE UPDATE ON scheduled_vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_vaccinations_updated_at();
