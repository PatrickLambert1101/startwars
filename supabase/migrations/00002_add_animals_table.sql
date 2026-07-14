-- Add missing animals table with all required columns
CREATE TABLE IF NOT EXISTS animals (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  name TEXT,
  visual_tag TEXT,
  rfid_tag TEXT,
  breed TEXT NOT NULL,
  sex TEXT NOT NULL,
  date_of_birth TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  dam_id TEXT REFERENCES animals(id),
  sire_id TEXT REFERENCES animals(id),
  registration_number TEXT,
  current_pasture_id TEXT REFERENCES pastures(id),
  herd_tag TEXT,
  notes TEXT,
  photos TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  genetic_traits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _changed TEXT DEFAULT '',
  _status TEXT DEFAULT 'created'
);

-- Create indexes for animals table
CREATE INDEX IF NOT EXISTS idx_animals_org ON animals(organization_id);
CREATE INDEX IF NOT EXISTS idx_animals_rfid ON animals(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_animals_visual ON animals(visual_tag);
CREATE INDEX IF NOT EXISTS idx_animals_herd_tag ON animals(herd_tag);
CREATE INDEX IF NOT EXISTS idx_animals_pasture ON animals(current_pasture_id);
CREATE INDEX IF NOT EXISTS idx_animals_changed ON animals(_changed);
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
