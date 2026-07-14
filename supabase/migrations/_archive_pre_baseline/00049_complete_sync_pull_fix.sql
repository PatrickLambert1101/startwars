-- ============================================================================
-- COMPLETE: Add all missing tables to sync_pull
-- ============================================================================

DROP FUNCTION IF EXISTS public.sync_pull(BIGINT);

CREATE FUNCTION public.sync_pull(last_pulled_at BIGINT DEFAULT 0)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '60s'
AS $$
DECLARE
  timestamp_now BIGINT;
  since_timestamp TIMESTAMPTZ;
  changes JSONB := '{}'::jsonb;
  created_records JSONB;
  updated_records JSONB;
  deleted_ids JSONB;
  user_org_ids UUID[];
  current_user_id UUID;
BEGIN
  timestamp_now := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := to_timestamp(last_pulled_at / 1000.0);
  current_user_id := auth.uid();

  SELECT ARRAY_AGG(DISTINCT organization_id) INTO user_org_ids
  FROM memberships
  WHERE user_id = current_user_id AND is_deleted = false AND is_active = true;

  IF user_org_ids IS NULL OR array_length(user_org_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'changes', jsonb_build_object(
        'organizations', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'memberships', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pastures', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'animals', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'treatment_protocols', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'health_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'weight_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'breeding_records', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pasture_movements', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'vaccination_schedules', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'scheduled_vaccinations', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb)
      ),
      'timestamp', timestamp_now
    );
  END IF;

  -- Organizations
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM organizations WHERE created_at > since_timestamp AND is_deleted = false AND id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM organizations WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM organizations WHERE updated_at > since_timestamp AND is_deleted = true AND id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM organizations WHERE is_deleted = false AND id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('organizations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Memberships
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM memberships WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM memberships WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM memberships WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM memberships WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('memberships', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Pastures
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM pastures WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM pastures WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM pastures WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM pastures WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('pastures', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Animals
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM animals WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM animals WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM animals WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM animals WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('animals', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Treatment Protocols
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'description', description, 'protocol_type', protocol_type, 'product_name', product_name, 'dosage', dosage, 'administration_method', administration_method, 'withdrawal_days', withdrawal_days, 'target_species', target_species, 'target_age_min', target_age_min, 'target_age_max', target_age_max, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM treatment_protocols WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'description', description, 'protocol_type', protocol_type, 'product_name', product_name, 'dosage', dosage, 'administration_method', administration_method, 'withdrawal_days', withdrawal_days, 'target_species', target_species, 'target_age_min', target_age_min, 'target_age_max', target_age_max, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM treatment_protocols WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM treatment_protocols WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'description', description, 'protocol_type', protocol_type, 'product_name', product_name, 'dosage', dosage, 'administration_method', administration_method, 'withdrawal_days', withdrawal_days, 'target_species', target_species, 'target_age_min', target_age_min, 'target_age_max', target_age_max, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM treatment_protocols WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('treatment_protocols', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Health Records
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'protocol_id', protocol_id, 'record_date', record_date, 'record_type', record_type, 'description', description, 'product_name', product_name, 'dosage', dosage, 'administered_by', administered_by, 'withdrawal_date', withdrawal_date, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM health_records WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'protocol_id', protocol_id, 'record_date', record_date, 'record_type', record_type, 'description', description, 'product_name', product_name, 'dosage', dosage, 'administered_by', administered_by, 'withdrawal_date', withdrawal_date, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM health_records WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM health_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'protocol_id', protocol_id, 'record_date', record_date, 'record_type', record_type, 'description', description, 'product_name', product_name, 'dosage', dosage, 'administered_by', administered_by, 'withdrawal_date', withdrawal_date, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM health_records WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('health_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Weight Records
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'record_date', record_date, 'weight_kg', weight_kg, 'condition_score', condition_score, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM weight_records WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'record_date', record_date, 'weight_kg', weight_kg, 'condition_score', condition_score, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM weight_records WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM weight_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'record_date', record_date, 'weight_kg', weight_kg, 'condition_score', condition_score, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM weight_records WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('weight_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Breeding Records
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'bull_id', bull_id, 'breeding_date', breeding_date, 'method', method, 'expected_calving_date', expected_calving_date, 'actual_calving_date', actual_calving_date, 'calf_id', calf_id, 'outcome', outcome, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM breeding_records WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'bull_id', bull_id, 'breeding_date', breeding_date, 'method', method, 'expected_calving_date', expected_calving_date, 'actual_calving_date', actual_calving_date, 'calf_id', calf_id, 'outcome', outcome, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM breeding_records WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM breeding_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'bull_id', bull_id, 'breeding_date', breeding_date, 'method', method, 'expected_calving_date', expected_calving_date, 'actual_calving_date', actual_calving_date, 'calf_id', calf_id, 'outcome', outcome, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM breeding_records WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('breeding_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Pasture Movements
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'pasture_id', pasture_id, 'animal_id', animal_id, 'movement_date', movement_date, 'movement_type', movement_type, 'moved_by', moved_by, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM pasture_movements WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'pasture_id', pasture_id, 'animal_id', animal_id, 'movement_date', movement_date, 'movement_type', movement_type, 'moved_by', moved_by, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM pasture_movements WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM pasture_movements WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'pasture_id', pasture_id, 'animal_id', animal_id, 'movement_date', movement_date, 'movement_type', movement_type, 'moved_by', moved_by, 'notes', notes, 'created_by_user_id', created_by_user_id, 'created_by_name', created_by_name, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM pasture_movements WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('pasture_movements', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Vaccination Schedules
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'description', description, 'species', species, 'first_dose_age_days', first_dose_age_days, 'booster_interval_days', booster_interval_days, 'annual_booster', annual_booster, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM vaccination_schedules WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'description', description, 'species', species, 'first_dose_age_days', first_dose_age_days, 'booster_interval_days', booster_interval_days, 'annual_booster', annual_booster, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM vaccination_schedules WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM vaccination_schedules WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'description', description, 'species', species, 'first_dose_age_days', first_dose_age_days, 'booster_interval_days', booster_interval_days, 'annual_booster', annual_booster, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM vaccination_schedules WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('vaccination_schedules', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Scheduled Vaccinations
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'schedule_id', schedule_id, 'due_date', due_date, 'administered_date', administered_date, 'status', status, 'notes', notes, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations WHERE created_at > since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'schedule_id', schedule_id, 'due_date', due_date, 'administered_date', administered_date, 'status', status, 'notes', notes, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM scheduled_vaccinations WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM scheduled_vaccinations WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'animal_id', animal_id, 'schedule_id', schedule_id, 'due_date', due_date, 'administered_date', administered_date, 'status', status, 'notes', notes, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations WHERE is_deleted = false AND organization_id = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('scheduled_vaccinations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.sync_pull(BIGINT) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ COMPLETE SYNC_PULL - ALL 11 TABLES IMPLEMENTED';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Organizations, Memberships, Pastures';
  RAISE NOTICE '✓ Animals, Treatment Protocols, Health Records';
  RAISE NOTICE '✓ Weight Records, Breeding Records, Pasture Movements';
  RAISE NOTICE '✓ Vaccination Schedules, Scheduled Vaccinations';
  RAISE NOTICE '✓ User filtering, 60s timeout, proper UUID handling';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
