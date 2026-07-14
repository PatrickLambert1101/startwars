-- Fix incorrect column name in sync_push_changes function
-- The function references 'electronic_tag' but the column is actually 'rfid_tag'

CREATE OR REPLACE FUNCTION sync_push_changes(changes jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record jsonb;
  result jsonb := '{"success": true, "errors": [], "error_count": 0}'::jsonb;
  error_array jsonb := '[]'::jsonb;
BEGIN
  -- Get current user's auth ID
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated',
      'errors', '[]'::jsonb,
      'error_count', 0
    );
  END IF;

  -- Process organizations
  IF changes ? 'organizations' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organizations'->'created', '[]'::jsonb) || COALESCE(changes->'organizations'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO organizations (id, name, livestock_types, location, default_breeds, subscription_tier, subscription_status, subscription_starts_at, subscription_ends_at, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'name'),
          (record->>'livestock_types'),
          (record->>'location'),
          (record->>'default_breeds'),
          COALESCE((record->>'subscription_tier'), 'starter'),
          (record->>'subscription_status'),
          (record->>'subscription_starts_at')::timestamptz,
          (record->>'subscription_ends_at')::timestamptz,
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          livestock_types = EXCLUDED.livestock_types,
          location = EXCLUDED.location,
          default_breeds = EXCLUDED.default_breeds,
          subscription_tier = EXCLUDED.subscription_tier,
          subscription_status = EXCLUDED.subscription_status,
          subscription_starts_at = EXCLUDED.subscription_starts_at,
          subscription_ends_at = EXCLUDED.subscription_ends_at,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_array := error_array || jsonb_build_object('table', 'organizations', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Process animals - FIX: Use rfid_tag instead of electronic_tag
  IF changes ? 'animals' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'animals'->'created', '[]'::jsonb) || COALESCE(changes->'animals'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO animals (id, organization_id, name, species, visual_tag, rfid_tag, breed, sex, date_of_birth, status, dam_id, sire_id, current_pasture_id, herd_tag, registration_number, notes, photos, tags, genetic_traits, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'name'),
          (record->>'species'),
          (record->>'visual_tag'),
          (record->>'rfid_tag'),
          (record->>'breed'),
          (record->>'sex'),
          (record->>'date_of_birth')::timestamptz,
          (record->>'status'),
          (record->>'dam_id'),
          (record->>'sire_id'),
          (record->>'current_pasture_id'),
          (record->>'herd_tag'),
          (record->>'registration_number'),
          (record->>'notes'),
          (record->>'photos'),
          (record->>'tags'),
          (record->>'genetic_traits'),
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          COALESCE((record->>'is_deleted')::boolean, false),
          (record->>'remote_id')
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          species = EXCLUDED.species,
          visual_tag = EXCLUDED.visual_tag,
          rfid_tag = EXCLUDED.rfid_tag,
          breed = EXCLUDED.breed,
          sex = EXCLUDED.sex,
          date_of_birth = EXCLUDED.date_of_birth,
          status = EXCLUDED.status,
          dam_id = EXCLUDED.dam_id,
          sire_id = EXCLUDED.sire_id,
          current_pasture_id = EXCLUDED.current_pasture_id,
          herd_tag = EXCLUDED.herd_tag,
          registration_number = EXCLUDED.registration_number,
          notes = EXCLUDED.notes,
          photos = EXCLUDED.photos,
          tags = EXCLUDED.tags,
          genetic_traits = EXCLUDED.genetic_traits,
          updated_at = EXCLUDED.updated_at,
          is_deleted = EXCLUDED.is_deleted,
          remote_id = EXCLUDED.remote_id;
      EXCEPTION WHEN OTHERS THEN
        error_array := error_array || jsonb_build_object('table', 'animals', 'record_id', record->>'id', 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- Build result
  result := jsonb_build_object(
    'success', jsonb_array_length(error_array) = 0,
    'errors', error_array,
    'error_count', jsonb_array_length(error_array)
  );

  RETURN result;
END;
$$;
