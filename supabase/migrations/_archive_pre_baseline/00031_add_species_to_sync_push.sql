-- Add species column to sync_push function animals INSERT
-- The species field was missing, causing NOT NULL constraint violations

CREATE OR REPLACE FUNCTION public.sync_push(changes JSONB)
RETURNS JSONB AS $$
DECLARE
  record JSONB;
  error_count INT := 0;
  errors JSONB := '[]'::jsonb;
BEGIN
  -- Process organizations
  IF changes ? 'organizations' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organizations'->'created', '[]'::jsonb) || COALESCE(changes->'organizations'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO organizations (id, name, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'name'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'organizations', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process organization_members (memberships)
  IF changes ? 'organization_members' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organization_members'->'created', '[]'::jsonb) || COALESCE(changes->'organization_members'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO memberships (id, organization_id, user_id, user_email, user_display_name, role, invited_at, joined_at, is_active, created_at, updated_at, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'user_id'),
          (record->>'user_email'),
          (record->>'user_display_name'),
          (record->>'role'),
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
          updated_at = EXCLUDED.updated_at;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'memberships', 'operation', 'update', 'record_id', record->>'id', 'error', SQLERRM);
        RAISE WARNING 'Failed to update membership %: %', record->>'id', SQLERRM;
      END;
    END LOOP;
  END IF;

  -- Process pastures
  IF changes ? 'pastures' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'pastures'->'created', '[]'::jsonb) || COALESCE(changes->'pastures'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO pastures (id, organization_id, name, size_hectares, location, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'name'),
          (record->>'size_hectares')::numeric,
          (record->>'location'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          size_hectares = EXCLUDED.size_hectares,
          location = EXCLUDED.location,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'pastures', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process animals - ADDED: species column
  IF changes ? 'animals' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'animals'->'created', '[]'::jsonb) || COALESCE(changes->'animals'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO animals (id, organization_id, species, name, visual_tag, rfid_tag, breed, sex, date_of_birth, status, dam_id, sire_id, current_pasture_id, notes, created_at, updated_at, is_deleted, remote_id)
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
          (record->>'current_pasture_id'),
          (record->>'notes'),
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
          current_pasture_id = EXCLUDED.current_pasture_id,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'animals', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process treatment_protocols
  IF changes ? 'treatment_protocols' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'treatment_protocols'->'created', '[]'::jsonb) || COALESCE(changes->'treatment_protocols'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO treatment_protocols (id, organization_id, name, description, dosage_per_kg, withdrawal_period_days, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'name'),
          (record->>'description'),
          (record->>'dosage_per_kg')::numeric,
          (record->>'withdrawal_period_days')::integer,
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          dosage_per_kg = EXCLUDED.dosage_per_kg,
          withdrawal_period_days = EXCLUDED.withdrawal_period_days,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'treatment_protocols', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process health_records
  IF changes ? 'health_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'health_records'->'created', '[]'::jsonb) || COALESCE(changes->'health_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO health_records (id, animal_id, treatment_protocol_id, treatment_date, dosage_ml, weight_at_treatment, administered_by, notes, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'animal_id'),
          (record->>'treatment_protocol_id'),
          (record->>'treatment_date')::timestamptz,
          (record->>'dosage_ml')::numeric,
          (record->>'weight_at_treatment')::numeric,
          (record->>'administered_by'),
          (record->>'notes'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          treatment_protocol_id = EXCLUDED.treatment_protocol_id,
          treatment_date = EXCLUDED.treatment_date,
          dosage_ml = EXCLUDED.dosage_ml,
          weight_at_treatment = EXCLUDED.weight_at_treatment,
          administered_by = EXCLUDED.administered_by,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'health_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process weight_records
  IF changes ? 'weight_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'weight_records'->'created', '[]'::jsonb) || COALESCE(changes->'weight_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO weight_records (id, animal_id, weight_kg, measurement_date, notes, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'animal_id'),
          (record->>'weight_kg')::numeric,
          (record->>'measurement_date')::timestamptz,
          (record->>'notes'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          weight_kg = EXCLUDED.weight_kg,
          measurement_date = EXCLUDED.measurement_date,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'weight_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process breeding_records
  IF changes ? 'breeding_records' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'breeding_records'->'created', '[]'::jsonb) || COALESCE(changes->'breeding_records'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO breeding_records (id, dam_id, sire_id, breeding_date, expected_calving_date, actual_calving_date, outcome, calf_id, notes, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'dam_id'),
          (record->>'sire_id'),
          (record->>'breeding_date')::timestamptz,
          (record->>'expected_calving_date')::timestamptz,
          (record->>'actual_calving_date')::timestamptz,
          (record->>'outcome'),
          (record->>'calf_id'),
          (record->>'notes'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          breeding_date = EXCLUDED.breeding_date,
          expected_calving_date = EXCLUDED.expected_calving_date,
          actual_calving_date = EXCLUDED.actual_calving_date,
          outcome = EXCLUDED.outcome,
          calf_id = EXCLUDED.calf_id,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'breeding_records', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process pasture_movements
  IF changes ? 'pasture_movements' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'pasture_movements'->'created', '[]'::jsonb) || COALESCE(changes->'pasture_movements'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO pasture_movements (id, animal_id, from_pasture_id, to_pasture_id, movement_date, reason, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'animal_id'),
          (record->>'from_pasture_id'),
          (record->>'to_pasture_id'),
          (record->>'movement_date')::timestamptz,
          (record->>'reason'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          from_pasture_id = EXCLUDED.from_pasture_id,
          to_pasture_id = EXCLUDED.to_pasture_id,
          movement_date = EXCLUDED.movement_date,
          reason = EXCLUDED.reason,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
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
