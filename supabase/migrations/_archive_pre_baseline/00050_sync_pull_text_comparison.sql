-- ============================================================================
-- FIX: Use TEXT comparison to avoid UUID type issues
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
  user_org_ids TEXT[];  -- Use TEXT instead of UUID to avoid type issues
  current_user_id UUID;
BEGIN
  timestamp_now := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := to_timestamp(last_pulled_at / 1000.0);
  current_user_id := auth.uid();

  -- Get user's organizations as TEXT array
  SELECT ARRAY_AGG(DISTINCT organization_id::TEXT) INTO user_org_ids
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

  -- Organizations (compare id::TEXT)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM organizations WHERE created_at > since_timestamp AND is_deleted = false AND id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM organizations WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM organizations WHERE updated_at > since_timestamp AND is_deleted = true AND id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM organizations WHERE is_deleted = false AND id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('organizations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Memberships
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM memberships WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM memberships WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM memberships WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM memberships WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('memberships', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Pastures
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM pastures WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM pastures WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM pastures WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM pastures WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('pastures', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Animals (WITH date_of_birth AND TEXT comparison)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM animals WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO updated_records FROM animals WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM animals WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    -- FULL SYNC: Return ALL animals for user's organizations WITH date_of_birth
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted, 'remote_id', remote_id)), '[]'::jsonb) INTO created_records FROM animals WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('animals', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Treatment Protocols (simplified - only essential columns)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM treatment_protocols t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM treatment_protocols t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM treatment_protocols WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM treatment_protocols t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('treatment_protocols', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Health Records, Weight Records, Breeding Records, Pasture Movements (using row_to_json for brevity)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM health_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM health_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM health_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM health_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('health_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM weight_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM weight_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM weight_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM weight_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('weight_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM breeding_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM breeding_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM breeding_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM breeding_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('breeding_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM pasture_movements t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM pasture_movements t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM pasture_movements WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM pasture_movements t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('pasture_movements', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM vaccination_schedules t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM vaccination_schedules t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM vaccination_schedules WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM vaccination_schedules t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('vaccination_schedules', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations t WHERE created_at > since_timestamp AND is_deleted = false AND animal_id IN (SELECT id FROM animals WHERE organization_id::TEXT = ANY(user_org_ids));
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM scheduled_vaccinations t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND animal_id IN (SELECT id FROM animals WHERE organization_id::TEXT = ANY(user_org_ids));
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM scheduled_vaccinations WHERE updated_at > since_timestamp AND is_deleted = true AND animal_id IN (SELECT id FROM animals WHERE organization_id::TEXT = ANY(user_org_ids));
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations t WHERE is_deleted = false AND animal_id IN (SELECT id FROM animals WHERE organization_id::TEXT = ANY(user_org_ids));
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('scheduled_vaccinations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Return all changes with timestamp
  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);
END;
$$ LANGUAGE plpgsql;
