-- Check if the "Bos" organization was inserted
SELECT id, name, created_at, is_deleted
FROM organizations
WHERE id = 'SUscZwZWRLLBTRrg';

-- Also check all organizations
SELECT id, name, created_at, is_deleted
FROM organizations
ORDER BY created_at DESC
LIMIT 5;
