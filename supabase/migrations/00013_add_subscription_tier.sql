-- Add subscription tier to organizations
-- This allows tracking which plan each organization is on

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'farm', 'commercial'));

CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);

-- Add subscription metadata
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial'));

COMMENT ON COLUMN organizations.subscription_tier IS 'Plan tier: starter (free), farm (R245/mo), or commercial (R999/mo)';
COMMENT ON COLUMN organizations.subscription_starts_at IS 'When the current subscription period started';
COMMENT ON COLUMN organizations.subscription_ends_at IS 'When the current subscription period ends';
COMMENT ON COLUMN organizations.subscription_status IS 'Current subscription status';
