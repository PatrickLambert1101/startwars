-- Just list ALL organizations in the database
SELECT id, name, created_at, is_deleted
FROM organizations
ORDER BY created_at DESC;

-- Count total orgs
SELECT COUNT(*) as total_orgs FROM organizations;

-- Check if ANY org exists with a name containing 'Bosveld'
SELECT id, name, created_at
FROM organizations
WHERE name ILIKE '%bosveld%';
