-- Check what organizations exist in Supabase
SELECT id, name, created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 10;

-- Check specifically for Bosveld
SELECT id, name, created_at
FROM organizations
WHERE name = 'Bosveld';

-- Check what the ID format looks like
SELECT id, name, LENGTH(id) as id_length
FROM organizations
LIMIT 5;
