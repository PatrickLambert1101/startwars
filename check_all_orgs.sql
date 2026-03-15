-- List ALL organizations in Supabase
SELECT id, name, created_at, subscription_tier
FROM organizations
ORDER BY created_at DESC;
