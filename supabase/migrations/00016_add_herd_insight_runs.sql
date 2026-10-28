-- Cache compact AI herd analyses and enforce usage limits in the Edge Function.
-- Direct client access is intentionally disabled; authenticated users call the
-- herd-insights function, which verifies organization membership first.
CREATE TABLE IF NOT EXISTS herd_insight_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_herd_insight_runs_org_created
  ON herd_insight_runs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_herd_insight_runs_cache
  ON herd_insight_runs(organization_id, input_hash, created_at DESC);

ALTER TABLE herd_insight_runs ENABLE ROW LEVEL SECURITY;

-- Keep the cache bounded without needing a scheduled job for normal usage.
CREATE OR REPLACE FUNCTION prune_old_herd_insight_runs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM herd_insight_runs WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prune_old_herd_insight_runs ON herd_insight_runs;
CREATE TRIGGER trigger_prune_old_herd_insight_runs
  AFTER INSERT ON herd_insight_runs
  FOR EACH STATEMENT EXECUTE FUNCTION prune_old_herd_insight_runs();
