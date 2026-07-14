-- Add missing columns to organizations table
-- These columns exist in local WatermelonDB but are missing from Supabase

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS default_breeds JSONB DEFAULT '{}'::jsonb;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'farm', 'commercial'));

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial'));

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMPTZ;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Create index for subscription_tier
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);

-- Comments
COMMENT ON COLUMN organizations.default_breeds IS 'Default breed per species: {"cattle":"Nguni","sheep":"Dorper"}';
COMMENT ON COLUMN organizations.subscription_tier IS 'Plan tier: starter (free), farm (R245/mo), or commercial (R999/mo)';
COMMENT ON COLUMN organizations.subscription_status IS 'Current subscription status';
