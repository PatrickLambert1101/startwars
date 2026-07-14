-- RESET DATABASE - WIPE ALL TABLES
-- WARNING: This will delete ALL data!
-- Only run this if you want to start completely fresh

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS pasture_movements CASCADE;
DROP TABLE IF EXISTS breeding_records CASCADE;
DROP TABLE IF EXISTS weight_records CASCADE;
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS treatment_protocols CASCADE;
DROP TABLE IF EXISTS pastures CASCADE;
DROP TABLE IF EXISTS animals CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All tables dropped successfully';
  RAISE NOTICE 'Database is now clean - ready for fresh migration';
END $$;
