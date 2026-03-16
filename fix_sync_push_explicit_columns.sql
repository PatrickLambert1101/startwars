-- Fixed sync_push that explicitly specifies columns for each table
-- This prevents jsonb_populate_record from causing issues with column ordering

CREATE OR REPLACE FUNCTION public.sync_push(changes JSONB)
RETURNS JSONB AS $$
DECLARE
  table_name TEXT;
  table_changes JSONB;
  created_records JSONB;
  updated_records JSONB;
  deleted_ids JSONB;
  record JSONB;
  record_id TEXT;
  error_count INT := 0;
  errors JSONB := '[]'::jsonb;
BEGIN
  -- Process organizations
  IF changes ? 'organizations' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organizations'->'created', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO organizations (id, name, livestock_types, location, default_breeds, subscription_tier, subscription_status, subscription_starts_at, subscription_ends_at, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'name'),
          (record->'livestock_types')::jsonb,
          (record->>'location'),
          (record->'default_breeds')::jsonb,
          (record->>'subscription_tier'),
          (record->>'subscription_status'),
          (record->>'subscription_starts_at')::timestamptz,
          (record->>'subscription_ends_at')::timestamptz,
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          (record->>'is_deleted')::boolean,
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
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'organizations', 'operation', 'create', 'record_id', record->>'id', 'error', SQLERRM);
        RAISE WARNING 'Failed to insert organization %: %', record->>'id', SQLERRM;
      END;
    END LOOP;

    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'organizations'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO organizations (id, name, livestock_types, location, default_breeds, subscription_tier, subscription_status, subscription_starts_at, subscription_ends_at, created_at, updated_at, is_deleted, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'name'),
          (record->'livestock_types')::jsonb,
          (record->>'location'),
          (record->'default_breeds')::jsonb,
          (record->>'subscription_tier'),
          (record->>'subscription_status'),
          (record->>'subscription_starts_at')::timestamptz,
          (record->>'subscription_ends_at')::timestamptz,
          (record->>'created_at')::timestamptz,
          (record->>'updated_at')::timestamptz,
          (record->>'is_deleted')::boolean,
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
        error_count := error_count + 1;
        errors := errors || jsonb_build_object('table', 'organizations', 'operation', 'update', 'record_id', record->>'id', 'error', SQLERRM);
        RAISE WARNING 'Failed to update organization %: %', record->>'id', SQLERRM;
      END;
    END LOOP;
  END IF;

  -- Process memberships
  IF changes ? 'memberships' THEN
    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'memberships'->'created', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO memberships (id, organization_id, user_id, user_email, user_display_name, role, invited_by, invited_at, joined_at, is_active, created_at, updated_at, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'user_id'),
          (record->>'user_email'),
          (record->>'user_display_name'),
          (record->>'role'),
          (record->>'invited_by'),
          (record->>'invited_at')::timestamptz,
          (record->>'joined_at')::timestamptz,
          (record->>'is_active')::boolean,
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
        errors := errors || jsonb_build_object('table', 'memberships', 'operation', 'create', 'record_id', record->>'id', 'error', SQLERRM);
        RAISE WARNING 'Failed to insert membership %: %', record->>'id', SQLERRM;
      END;
    END LOOP;

    FOR record IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'memberships'->'updated', '[]'::jsonb)) LOOP
      BEGIN
        INSERT INTO memberships (id, organization_id, user_id, user_email, user_display_name, role, invited_by, invited_at, joined_at, is_active, created_at, updated_at, remote_id)
        VALUES (
          (record->>'id'),
          (record->>'organization_id'),
          (record->>'user_id'),
          (record->>'user_email'),
          (record->>'user_display_name'),
          (record->>'role'),
          (record->>'invited_by'),
          (record->>'invited_at')::timestamptz,
          (record->>'joined_at')::timestamptz,
          (record->>'is_active')::boolean,
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

  IF error_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error_count', error_count, 'errors', errors);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sync_push(JSONB) TO authenticated;
