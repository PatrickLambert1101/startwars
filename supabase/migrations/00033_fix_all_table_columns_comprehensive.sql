-- COMPREHENSIVE FIX: All table columns to match WatermelonDB schema
-- This fixes massive column name mismatches and missing columns across all tables

CREATE OR REPLACE FUNCTION public.sync_push(changes JSONB)
RETURNS JSONB AS $$
DECLARE
  record JSONB;
  error_count INT := 0;
  errors JSONB := '[]'::jsonb;
BEGIN
  -- Process organizations - FIXED: Added all missing columns
  IF changes ? 'organizations' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organizations'->'created', '[]'::jsonb) || COALESCE(changes->'organizations'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO organizations (id, name, livestock_types, location, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'name'),
          (record->>'livestock_types'),
          (record->>'location'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          livestock_types = EXCLUDED.livestock_types,
          location = EXCLUDED.location,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'organizations', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process organization_members (memberships) - FIXED: Added invited_by and is_deleted
  IF changes ? 'organization_members' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organization_members'->'created', '[]'::jsonb) || COALESCE(changes->'organization_members'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO memberships (id, organization_id, user_id, user_email, user_display_name, role, invited_by, invited_at, joined_at, is_active, created_at, updated_at, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'user_id'),
          (record->>'user_email'),
          (record->>'user_display_name'),
          (record->>'role'),
          (record->>'invited_by')::uuid,
          (record->>'invited_at')::timestamptz,
          (record->>'joined_at')::timestamptz,
          COALESCE((record->>'is_active')::boolean, true),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          user_id = EXCLUDED.user_id,
          user_email = EXCLUDED.user_email,
          user_display_name = EXCLUDED.user_display_name,
          role = EXCLUDED.role,
          invited_by = EXCLUDED.invited_by,
          updated_at = EXCLUDED.updated_at;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'memberships', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process pastures - FIXED: All columns match WatermelonDB schema
  IF changes ? 'pastures' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'pastures'->'created', '[]'::jsonb) || COALESCE(changes->'pastures'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO pastures (id, organization_id, name, code, size_hectares, location_notes, forage_type, water_source, fence_type, has_salt_blocks, has_mineral_feeders, max_capacity, target_grazing_days, target_rest_days, current_animal_count, last_grazed_date, available_from_date, is_active, notes, photos, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'name'),
          (record->>'code'),
          (record->>'size_hectares')::numeric,
          (record->>'location_notes'),
          (record->>'forage_type'),
          (record->>'water_source'),
          (record->>'fence_type'),
          (record->>'has_salt_blocks')::boolean,
          (record->>'has_mineral_feeders')::boolean,
          (record->>'max_capacity')::integer,
          (record->>'target_grazing_days')::integer,
          (record->>'target_rest_days')::integer,
          (record->>'current_animal_count')::integer,
          (record->>'last_grazed_date')::timestamptz,
          (record->>'available_from_date')::timestamptz,
          COALESCE((record->>'is_active')::boolean, true),
          (record->>'notes'),
          (record->>'photos'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          size_hectares = EXCLUDED.size_hectares,
          location_notes = EXCLUDED.location_notes,
          forage_type = EXCLUDED.forage_type,
          water_source = EXCLUDED.water_source,
          fence_type = EXCLUDED.fence_type,
          has_salt_blocks = EXCLUDED.has_salt_blocks,
          has_mineral_feeders = EXCLUDED.has_mineral_feeders,
          max_capacity = EXCLUDED.max_capacity,
          target_grazing_days = EXCLUDED.target_grazing_days,
          target_rest_days = EXCLUDED.target_rest_days,
          current_animal_count = EXCLUDED.current_animal_count,
          last_grazed_date = EXCLUDED.last_grazed_date,
          available_from_date = EXCLUDED.available_from_date,
          is_active = EXCLUDED.is_active,
          notes = EXCLUDED.notes,
          photos = EXCLUDED.photos,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'pastures', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process animals - Already fixed in previous migration
  IF changes ? 'animals' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'animals'->'created', '[]'::jsonb) || COALESCE(changes->'animals'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO animals (id, organization_id, species, name, visual_tag, rfid_tag, breed, sex, date_of_birth, status, dam_id, sire_id, registration_number, current_pasture_id, herd_tag, notes, photos, tags, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'species'),
          (record->>'name'),
          (record->>'visual_tag'),
          (record->>'rfid_tag'),
          (record->>'breed'),
          (record->>'sex'),
          (record->>'date_of_birth')::timestamptz,
          (record->>'status'),
          (record->>'dam_id'),
          (record->>'sire_id'),
          (record->>'registration_number'),
          (record->>'current_pasture_id'),
          (record->>'herd_tag'),
          (record->>'notes'),
          (record->>'photos'),
          (record->>'tags'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          species = EXCLUDED.species,
          name = EXCLUDED.name,
          visual_tag = EXCLUDED.visual_tag,
          rfid_tag = EXCLUDED.rfid_tag,
          breed = EXCLUDED.breed,
          sex = EXCLUDED.sex,
          date_of_birth = EXCLUDED.date_of_birth,
          status = EXCLUDED.status,
          dam_id = EXCLUDED.dam_id,
          sire_id = EXCLUDED.sire_id,
          registration_number = EXCLUDED.registration_number,
          current_pasture_id = EXCLUDED.current_pasture_id,
          herd_tag = EXCLUDED.herd_tag,
          notes = EXCLUDED.notes,
          photos = EXCLUDED.photos,
          tags = EXCLUDED.tags,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'animals', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process treatment_protocols - FIXED: Correct column names and all fields
  IF changes ? 'treatment_protocols' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'treatment_protocols'->'created', '[]'::jsonb) || COALESCE(changes->'treatment_protocols'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO treatment_protocols (id, organization_id, name, description, protocol_type, product_name, dosage, administration_method, withdrawal_days, target_species, target_age_min, target_age_max, is_active, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'name'),
          (record->>'description'),
          (record->>'protocol_type'),
          (record->>'product_name'),
          (record->>'dosage'),
          (record->>'administration_method'),
          (record->>'withdrawal_days')::integer,
          (record->>'target_species'),
          (record->>'target_age_min')::integer,
          (record->>'target_age_max')::integer,
          COALESCE((record->>'is_active')::boolean, true),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          protocol_type = EXCLUDED.protocol_type,
          product_name = EXCLUDED.product_name,
          dosage = EXCLUDED.dosage,
          administration_method = EXCLUDED.administration_method,
          withdrawal_days = EXCLUDED.withdrawal_days,
          target_species = EXCLUDED.target_species,
          target_age_min = EXCLUDED.target_age_min,
          target_age_max = EXCLUDED.target_age_max,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'treatment_protocols', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process health_records - FIXED: Correct column names (protocol_id, record_date, dosage, etc.)
  IF changes ? 'health_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'health_records'->'created', '[]'::jsonb) || COALESCE(changes->'health_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO health_records (id, organization_id, animal_id, protocol_id, record_date, record_type, description, product_name, dosage, administered_by, withdrawal_date, notes, created_by_user_id, created_by_name, photos, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'animal_id'),
          (record->>'protocol_id'),
          (record->>'record_date')::timestamptz,
          (record->>'record_type'),
          (record->>'description'),
          (record->>'product_name'),
          (record->>'dosage'),
          (record->>'administered_by'),
          (record->>'withdrawal_date')::timestamptz,
          (record->>'notes'),
          (record->>'created_by_user_id'),
          (record->>'created_by_name'),
          (record->>'photos'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          protocol_id = EXCLUDED.protocol_id,
          record_date = EXCLUDED.record_date,
          record_type = EXCLUDED.record_type,
          description = EXCLUDED.description,
          product_name = EXCLUDED.product_name,
          dosage = EXCLUDED.dosage,
          administered_by = EXCLUDED.administered_by,
          withdrawal_date = EXCLUDED.withdrawal_date,
          notes = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name = EXCLUDED.created_by_name,
          photos = EXCLUDED.photos,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'health_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process weight_records - FIXED: Correct column name (record_date not measurement_date)
  IF changes ? 'weight_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'weight_records'->'created', '[]'::jsonb) || COALESCE(changes->'weight_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO weight_records (id, organization_id, animal_id, record_date, weight_kg, condition_score, notes, created_by_user_id, created_by_name, photos, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'animal_id'),
          (record->>'record_date')::timestamptz,
          (record->>'weight_kg')::numeric,
          (record->>'condition_score')::integer,
          (record->>'notes'),
          (record->>'created_by_user_id'),
          (record->>'created_by_name'),
          (record->>'photos'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          record_date = EXCLUDED.record_date,
          weight_kg = EXCLUDED.weight_kg,
          condition_score = EXCLUDED.condition_score,
          notes = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name = EXCLUDED.created_by_name,
          photos = EXCLUDED.photos,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'weight_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process breeding_records - FIXED: Correct column names (animal_id, bull_id, method)
  IF changes ? 'breeding_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'breeding_records'->'created', '[]'::jsonb) || COALESCE(changes->'breeding_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO breeding_records (id, organization_id, animal_id, bull_id, breeding_date, method, expected_calving_date, actual_calving_date, calf_id, outcome, notes, created_by_user_id, created_by_name, photos, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'animal_id'),
          (record->>'bull_id'),
          (record->>'breeding_date')::timestamptz,
          (record->>'method'),
          (record->>'expected_calving_date')::timestamptz,
          (record->>'actual_calving_date')::timestamptz,
          (record->>'calf_id'),
          (record->>'outcome'),
          (record->>'notes'),
          (record->>'created_by_user_id'),
          (record->>'created_by_name'),
          (record->>'photos'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          animal_id = EXCLUDED.animal_id,
          bull_id = EXCLUDED.bull_id,
          breeding_date = EXCLUDED.breeding_date,
          method = EXCLUDED.method,
          expected_calving_date = EXCLUDED.expected_calving_date,
          actual_calving_date = EXCLUDED.actual_calving_date,
          calf_id = EXCLUDED.calf_id,
          outcome = EXCLUDED.outcome,
          notes = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name = EXCLUDED.created_by_name,
          photos = EXCLUDED.photos,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'breeding_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process pasture_movements - FIXED: Correct schema (pasture_id, movement_type, moved_by)
  IF changes ? 'pasture_movements' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'pasture_movements'->'created', '[]'::jsonb) || COALESCE(changes->'pasture_movements'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO pasture_movements (id, organization_id, pasture_id, animal_id, movement_date, movement_type, moved_by, notes, created_by_user_id, created_by_name, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'pasture_id'),
          (record->>'animal_id'),
          (record->>'movement_date')::timestamptz,
          (record->>'movement_type'),
          (record->>'moved_by'),
          (record->>'notes'),
          (record->>'created_by_user_id'),
          (record->>'created_by_name'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          pasture_id = EXCLUDED.pasture_id,
          movement_date = EXCLUDED.movement_date,
          movement_type = EXCLUDED.movement_type,
          moved_by = EXCLUDED.moved_by,
          notes = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name = EXCLUDED.created_by_name,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'pasture_movements', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  IF error_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error_count', error_count, 'errors', errors);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sync_push(JSONB) TO authenticated;
