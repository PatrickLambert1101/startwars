-- Check if "Boss I" organization synced
SELECT id, name, created_at, subscription_tier, remote_id
FROM organizations
WHERE name LIKE '%Boss%'
ORDER BY created_at DESC;

-- Also check for the specific ID
SELECT id, name, created_at
FROM organizations  
WHERE id = 'ECWM4TXJD6JFvQcr';
