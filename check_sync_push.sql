-- Check the sync_push function definition
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'sync_push'
AND routine_schema = 'public'
LIMIT 1;
