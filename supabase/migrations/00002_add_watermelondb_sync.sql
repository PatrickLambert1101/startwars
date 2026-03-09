  -- Add WatermelonDB sync support columns
  -- These columns are required for WatermelonDB sync protocol to work
  -- _changed: Text column to track which fields have changed (comma-separated list)
  -- _status: Text column to track sync status ('created', 'updated', 'deleted')

  -- Add to organizations
  ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS _changed TEXT,
    ADD COLUMN IF NOT EXISTS _status TEXT DEFAULT 'created',
    ADD COLUMN IF NOT EXISTS livestock_types JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS location TEXT;

  -- Add to animals
  ALTER TABLE public.animals
    ADD COLUMN IF NOT EXISTS _changed TEXT,
    ADD COLUMN IF NOT EXISTS _status TEXT DEFAULT 'created';

  -- Add to health_records
  ALTER TABLE public.health_records
    ADD COLUMN IF NOT EXISTS _changed TEXT,
    ADD COLUMN IF NOT EXISTS _status TEXT DEFAULT 'created',
    ADD COLUMN IF NOT EXISTS protocol_id TEXT;

  -- Add to weight_records
  ALTER TABLE public.weight_records
    ADD COLUMN IF NOT EXISTS _changed TEXT,
    ADD COLUMN IF NOT EXISTS _status TEXT DEFAULT 'created';

  -- Add to breeding_records
  ALTER TABLE public.breeding_records
    ADD COLUMN IF NOT EXISTS _changed TEXT,
    ADD COLUMN IF NOT EXISTS _status TEXT DEFAULT 'created';

  -- Create treatment_protocols table (missing from initial schema)
  CREATE TABLE IF NOT EXISTS public.treatment_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remote_id TEXT,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    product_name TEXT,
    dosage TEXT,
    route TEXT,
    frequency TEXT,
    duration TEXT,
    withdrawal_period_days INTEGER,
    target_species TEXT,
    target_age_min_months INTEGER,
    target_age_max_months INTEGER,
    notes TEXT,
    times_applied INTEGER DEFAULT 0,
    times_applied_today INTEGER DEFAULT 0,
    last_applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    _changed TEXT,
    _status TEXT DEFAULT 'created'
  );

  CREATE INDEX IF NOT EXISTS idx_protocols_org ON public.treatment_protocols(organization_id);

  ALTER TABLE public.treatment_protocols ENABLE ROW LEVEL SECURITY;

  -- RLS policy for treatment_protocols
  CREATE POLICY "Users can access protocols in their orgs"
    ON public.treatment_protocols FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.memberships
        WHERE memberships.organization_id = treatment_protocols.organization_id
          AND memberships.user_id = auth.uid()
      )
    );

  -- Add updated_at trigger for treatment_protocols
  CREATE TRIGGER treatment_protocols_updated_at
    BEFORE UPDATE ON public.treatment_protocols
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

  -- Create indexes on _changed and _status for better sync performance
  CREATE INDEX IF NOT EXISTS idx_organizations_changed ON public.organizations(_changed);
  CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(_status);

  CREATE INDEX IF NOT EXISTS idx_animals_changed ON public.animals(_changed);
  CREATE INDEX IF NOT EXISTS idx_animals_status ON public.animals(_status);

  CREATE INDEX IF NOT EXISTS idx_health_changed ON public.health_records(_changed);
  CREATE INDEX IF NOT EXISTS idx_health_status ON public.health_records(_status);

  CREATE INDEX IF NOT EXISTS idx_weight_changed ON public.weight_records(_changed);
  CREATE INDEX IF NOT EXISTS idx_weight_status ON public.weight_records(_status);

  CREATE INDEX IF NOT EXISTS idx_breeding_changed ON public.breeding_records(_changed);
  CREATE INDEX IF NOT EXISTS idx_breeding_status ON public.breeding_records(_status);

  CREATE INDEX IF NOT EXISTS idx_protocols_changed ON public.treatment_protocols(_changed);
  CREATE INDEX IF NOT EXISTS idx_protocols_status ON public.treatment_protocols(_status);
