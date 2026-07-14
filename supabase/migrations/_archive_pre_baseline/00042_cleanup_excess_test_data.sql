-- ============================================================================
-- Cleanup excess test data to fix first sync timeout
-- ============================================================================
-- Delete all animals except first 100 from Demo Ranch
-- This allows first sync to complete within 9 second timeout
-- ============================================================================

DO $$
DECLARE
  demo_org_id TEXT := '68b89705-d443-41f3-9923-ab010404e429';
  keep_animal_ids TEXT[];
  delete_count INTEGER;
BEGIN
  -- Get IDs of first 100 animals to keep
  SELECT ARRAY_AGG(id) INTO keep_animal_ids
  FROM (
    SELECT id FROM animals
    WHERE organization_id = demo_org_id
    ORDER BY created_at ASC
    LIMIT 100
  ) AS keep_animals;

  RAISE NOTICE 'Keeping % animals', COALESCE(array_length(keep_animal_ids, 1), 0);

  -- Delete related records for animals NOT in keep list
  DELETE FROM health_records
  WHERE animal_id IN (
    SELECT id FROM animals
    WHERE organization_id = demo_org_id
    AND id != ALL(COALESCE(keep_animal_ids, ARRAY[]::TEXT[]))
  );

  DELETE FROM weight_records
  WHERE animal_id IN (
    SELECT id FROM animals
    WHERE organization_id = demo_org_id
    AND id != ALL(COALESCE(keep_animal_ids, ARRAY[]::TEXT[]))
  );

  DELETE FROM breeding_records
  WHERE animal_id IN (
    SELECT id FROM animals
    WHERE organization_id = demo_org_id
    AND id != ALL(COALESCE(keep_animal_ids, ARRAY[]::TEXT[]))
  );

  DELETE FROM pasture_movements
  WHERE animal_id IN (
    SELECT id FROM animals
    WHERE organization_id = demo_org_id
    AND id != ALL(COALESCE(keep_animal_ids, ARRAY[]::TEXT[]))
  );

  -- Delete the excess animals
  DELETE FROM animals
  WHERE organization_id = demo_org_id
  AND id != ALL(COALESCE(keep_animal_ids, ARRAY[]::TEXT[]));

  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % excess animals', delete_count;

  -- Show final counts
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ CLEANUP COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Final animals count: %', (SELECT COUNT(*) FROM animals);
  RAISE NOTICE 'Final health_records count: %', (SELECT COUNT(*) FROM health_records);
  RAISE NOTICE 'Final weight_records count: %', (SELECT COUNT(*) FROM weight_records);
  RAISE NOTICE 'Final breeding_records count: %', (SELECT COUNT(*) FROM breeding_records);
  RAISE NOTICE '============================================================================';
END $$;
