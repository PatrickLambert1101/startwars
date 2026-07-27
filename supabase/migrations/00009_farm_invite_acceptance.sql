-- 00009_farm_invite_acceptance.sql
--
-- Enables the invite-acceptance flow: an invited user signs in normally, sees a
-- pending invite matched by their email on the Dashboard, and accepts it to join
-- the farm. Also adds "leave farm".
--
-- Three things are added:
--   1. A patch to sync_pull so a user ALWAYS receives their OWN membership rows,
--      even when they currently belong to zero orgs. Without this, a membership
--      created server-side by accept_invite_by_email would never sync down (the
--      old function early-returned empty for zero-membership users), so the
--      client's currentOrg would never update. This also fixes leave
--      propagation across devices (leaving removes the org from scope before the
--      delete could be emitted) and self-heals already-stranded invitees.
--   2. list_pending_invites()      — pending invites for the caller, by email.
--   3. accept_invite_by_email(id)   — email-authorized accept (reactivate on rejoin).
--   4. leave_organization(org_id)   — soft-delete own membership; blocks last admin.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. sync_pull: include the caller's own memberships regardless of org scope
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_pull(last_pulled_at bigint DEFAULT 0, client_schema_version integer DEFAULT 17)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '60s'
AS $function$
DECLARE
  timestamp_now    BIGINT;
  since_timestamp  TIMESTAMPTZ;
  changes          JSONB := '{}'::jsonb;
  created_records  JSONB;
  updated_records  JSONB;
  deleted_ids      JSONB;
  user_org_ids     TEXT[];
  current_user_id  UUID;
  memberships_json JSONB;
BEGIN
  timestamp_now   := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := to_timestamp(last_pulled_at / 1000.0);
  current_user_id := auth.uid();

  SELECT ARRAY_AGG(DISTINCT organization_id::TEXT) INTO user_org_ids
  FROM memberships
  WHERE user_id = current_user_id AND is_deleted = false AND is_active = true;

  -- Build the caller's OWN membership rows first (always, by user_id). This is
  -- what lets a just-accepted membership — or a just-left one — reach the client
  -- even when user_org_ids is empty or the org has fallen out of scope.
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM memberships WHERE created_at > since_timestamp AND is_deleted = false AND (organization_id::TEXT = ANY(user_org_ids) OR user_id = current_user_id);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO updated_records FROM memberships WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND (organization_id::TEXT = ANY(user_org_ids) OR user_id = current_user_id);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM memberships WHERE updated_at > since_timestamp AND is_deleted = true AND (organization_id::TEXT = ANY(user_org_ids) OR user_id = current_user_id);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM memberships WHERE is_deleted = false AND (organization_id::TEXT = ANY(user_org_ids) OR user_id = current_user_id);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  memberships_json := jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids);

  -- Zero-org users still get their own memberships (so accept can surface a farm).
  IF user_org_ids IS NULL OR array_length(user_org_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'changes', jsonb_build_object(
        'organizations',          jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'memberships',            memberships_json,
        'pastures',               jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'animals',                jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'treatment_protocols',    jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'health_records',         jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'weight_records',         jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'breeding_records',       jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pasture_movements',      jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'vaccination_schedules',  jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'scheduled_vaccinations', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb)
      ),
      'timestamp', timestamp_now
    );
  END IF;

  -- Organizations (now includes subscription_status/starts_at/ends_at)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'subscription_status', subscription_status, 'subscription_starts_at', subscription_starts_at, 'subscription_ends_at', subscription_ends_at, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM organizations WHERE created_at > since_timestamp AND is_deleted = false AND id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'subscription_status', subscription_status, 'subscription_starts_at', subscription_starts_at, 'subscription_ends_at', subscription_ends_at, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO updated_records FROM organizations WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM organizations WHERE updated_at > since_timestamp AND is_deleted = true AND id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'livestock_types', livestock_types, 'location', location, 'subscription_tier', subscription_tier, 'subscription_status', subscription_status, 'subscription_starts_at', subscription_starts_at, 'subscription_ends_at', subscription_ends_at, 'default_breeds', default_breeds, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM organizations WHERE is_deleted = false AND id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('organizations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Memberships (built above; may include rows outside user_org_ids for this user)
  changes := changes || jsonb_build_object('memberships', memberships_json);

  -- Pastures
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM pastures WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO updated_records FROM pastures WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM pastures WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'name', name, 'code', code, 'size_hectares', size_hectares, 'location_notes', location_notes, 'forage_type', forage_type, 'water_source', water_source, 'fence_type', fence_type, 'has_salt_blocks', has_salt_blocks, 'has_mineral_feeders', has_mineral_feeders, 'max_capacity', max_capacity, 'target_grazing_days', target_grazing_days, 'target_rest_days', target_rest_days, 'current_animal_count', current_animal_count, 'last_grazed_date', last_grazed_date, 'available_from_date', available_from_date, 'is_active', is_active, 'notes', notes, 'photos', photos, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM pastures WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('pastures', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Animals
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'vaccinations_up_to_date', vaccinations_up_to_date, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM animals WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'vaccinations_up_to_date', vaccinations_up_to_date, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO updated_records FROM animals WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM animals WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'vaccinations_up_to_date', vaccinations_up_to_date, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM animals WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('animals', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Treatment Protocols
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM treatment_protocols t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM treatment_protocols t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM treatment_protocols WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM treatment_protocols t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('treatment_protocols', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Health Records
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM health_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM health_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM health_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM health_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('health_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Weight Records
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM weight_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM weight_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM weight_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM weight_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('weight_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Breeding Records
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM breeding_records t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM breeding_records t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM breeding_records WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM breeding_records t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('breeding_records', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Pasture Movements
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM pasture_movements t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM pasture_movements t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM pasture_movements WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM pasture_movements t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('pasture_movements', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Vaccination Schedules
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM vaccination_schedules t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM vaccination_schedules t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM vaccination_schedules WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM vaccination_schedules t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('vaccination_schedules', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Scheduled Vaccinations (fixed: direct org filter instead of correlated subquery)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM scheduled_vaccinations t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM scheduled_vaccinations WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('scheduled_vaccinations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  -- Report Templates (only clients on local schema >= 18 know this table)
  IF client_schema_version >= 18 THEN
    IF last_pulled_at > 0 THEN
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM report_templates t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM report_templates t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
      SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM report_templates WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
    ELSE
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM report_templates t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
      updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
    END IF;
    changes := changes || jsonb_build_object('report_templates', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));
  END IF;

  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. list_pending_invites() — pending invites for the caller, matched by email
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_pending_invites()
 RETURNS TABLE (
   id               TEXT,
   organization_id  TEXT,
   organization_name TEXT,
   role             TEXT,
   invited_by       UUID,
   expires_at       TIMESTAMPTZ
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT i.id, i.organization_id, o.name AS organization_name, i.role, i.invited_by, i.expires_at
  FROM invites i
  JOIN organizations o ON o.id = i.organization_id
  WHERE i.email IS NOT NULL
    AND auth.email() IS NOT NULL
    AND lower(i.email) = lower(auth.email())
    AND i.accepted_at IS NULL
    AND i.expires_at > now()
    AND o.is_deleted = false
    AND NOT EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = i.organization_id
        AND m.user_id = auth.uid()
        AND m.is_active = true
        AND m.is_deleted = false
    );
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. accept_invite_by_email(invite_id) — email-authorized accept, reactivate on rejoin
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_invite_by_email(invite_id_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  invite_record    RECORD;
  existing_row     RECORD;
  new_membership_id TEXT;
  caller_email     TEXT;
  caller_name      TEXT;
BEGIN
  -- memberships.id has no DB default (clients normally supply a WatermelonDB id),
  -- so generate a 16-char id here to match that format.
  new_membership_id := substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
  caller_email := auth.email();
  IF caller_email IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'No email on account');
  END IF;

  -- Authorization: the invite must be addressed to the caller's own email.
  -- Never trust invite_id alone.
  SELECT * INTO invite_record
  FROM invites
  WHERE id = invite_id_param
    AND email IS NOT NULL
    AND lower(email) = lower(caller_email)
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid or expired invite');
  END IF;

  SELECT raw_user_meta_data->>'display_name' INTO caller_name
  FROM auth.users WHERE id = auth.uid();

  -- If a membership row already exists for this user + org, reactivate it
  -- (handles re-invite after leaving). Otherwise insert a fresh row.
  SELECT * INTO existing_row
  FROM memberships
  WHERE organization_id = invite_record.organization_id
    AND user_id = auth.uid()
  LIMIT 1;

  IF FOUND THEN
    IF existing_row.is_active = true AND existing_row.is_deleted = false THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'You are already a member of this farm');
    END IF;

    UPDATE memberships
    SET is_active = true,
        is_deleted = false,
        role = invite_record.role,
        invited_by = invite_record.invited_by,
        invited_at = invite_record.created_at,
        joined_at = now(),
        user_email = caller_email,
        user_display_name = COALESCE(caller_name, user_display_name),
        updated_at = now()
    WHERE id = existing_row.id
    RETURNING id INTO new_membership_id;
  ELSE
    INSERT INTO memberships (
      id, user_id, organization_id, role, invited_by, invited_at, joined_at,
      is_active, is_deleted, user_email, user_display_name, updated_at
    ) VALUES (
      new_membership_id, auth.uid(), invite_record.organization_id, invite_record.role,
      invite_record.invited_by, invite_record.created_at, now(),
      TRUE, FALSE, caller_email, caller_name, now()
    );
  END IF;

  UPDATE invites SET accepted_at = now(), updated_at = now() WHERE id = invite_record.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'organization_id', invite_record.organization_id,
    'membership_id', new_membership_id
  );
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. leave_organization(org_id) — soft-delete own membership; block last admin
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.leave_organization(org_id_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  my_membership RECORD;
  active_admin_count INTEGER;
BEGIN
  SELECT * INTO my_membership
  FROM memberships
  WHERE user_id = auth.uid()
    AND organization_id = org_id_param
    AND is_active = true
    AND is_deleted = false
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'not_a_member');
  END IF;

  -- Prevent the last remaining admin from leaving an otherwise-managed farm.
  IF my_membership.role = 'admin' THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM memberships
    WHERE organization_id = org_id_param
      AND role = 'admin'
      AND is_active = true
      AND is_deleted = false;

    IF active_admin_count <= 1 THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'last_admin');
    END IF;
  END IF;

  UPDATE memberships
  SET is_active = false, is_deleted = true, updated_at = now()
  WHERE id = my_membership.id;

  RETURN jsonb_build_object('success', TRUE, 'organization_id', org_id_param);
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants: authenticated users only (never anon)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.list_pending_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invite_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_organization(text) TO authenticated;
