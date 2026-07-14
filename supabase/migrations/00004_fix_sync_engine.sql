-- ===========================================================================
-- Fix sync engine: critical bugs in sync_push, triggers, and sync_pull
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop updated_at triggers on synced tables.
--    These BEFORE UPDATE triggers override the client's updated_at with NOW(),
--    so every sync_push write comes back as "changed" on the very next pull
--    (perpetual no-op sync loop for orgs, memberships, and vaccination rows).
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
DROP TRIGGER IF EXISTS memberships_updated_at ON public.memberships;
DROP TRIGGER IF EXISTS vaccination_schedules_updated_at ON public.vaccination_schedules;
DROP TRIGGER IF EXISTS scheduled_vaccinations_updated_at ON public.scheduled_vaccinations;

-- ---------------------------------------------------------------------------
-- 2. Fix auto_add_org_owner trigger.
--    Old version used pg_stat_activity to detect sync context (fragile/broken)
--    and ON CONFLICT (id) DO NOTHING (wrong — the unique constraint is
--    (organization_id, user_id), not id alone, so it would create duplicate rows).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  INSERT INTO public.memberships (
    user_id,
    organization_id,
    user_email,
    user_display_name,
    role,
    joined_at,
    is_active,
    is_deleted
  )
  SELECT
    auth.uid(),
    NEW.id,
    email,
    raw_user_meta_data->>'display_name',
    'admin',
    NOW(),
    TRUE,
    FALSE
  FROM auth.users
  WHERE id = auth.uid()
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Drop dead sync_push_changes function (never called by client).
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.sync_push_changes(jsonb);

-- ---------------------------------------------------------------------------
-- 4. Replace sync_push with a complete, correct implementation.
--
--    Bugs fixed vs old version:
--    - Was checking changes ? 'organization_members'; client sends 'memberships'
--      → memberships were NEVER pushed to Supabase
--    - Organizations: missing subscription_tier/status/dates/default_breeds
--    - Animals: missing genetic_traits column
--    - Memberships ON CONFLICT: missing is_active and is_deleted
--    - Missing tables: vaccination_schedules and scheduled_vaccinations
--    - No auth check
--    - Deleted arrays ignored (now handled as soft-deletes)
--    - Empty-string JSONB values (e.g. tags="") now handled via NULLIF
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_push(changes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  rec      JSONB;
  rec_id   TEXT;
  err_cnt  INT  := 0;
  errs     JSONB := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'Not authenticated',
      'errors', '[]'::jsonb, 'error_count', 0
    );
  END IF;

  -- ---- Organizations -------------------------------------------------------
  IF changes ? 'organizations' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'organizations'->'created', '[]'::jsonb) ||
      COALESCE(changes->'organizations'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO organizations (
          id, name, livestock_types, location,
          default_breeds, subscription_tier, subscription_status,
          subscription_starts_at, subscription_ends_at,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'name',
          rec->>'livestock_types',
          rec->>'location',
          COALESCE(NULLIF(rec->>'default_breeds', '')::jsonb, '{}'::jsonb),
          COALESCE(NULLIF(rec->>'subscription_tier', ''), 'starter'),
          rec->>'subscription_status',
          NULLIF(rec->>'subscription_starts_at', '')::timestamptz,
          NULLIF(rec->>'subscription_ends_at',   '')::timestamptz,
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          name                   = EXCLUDED.name,
          livestock_types        = EXCLUDED.livestock_types,
          location               = EXCLUDED.location,
          default_breeds         = EXCLUDED.default_breeds,
          subscription_tier      = EXCLUDED.subscription_tier,
          subscription_status    = EXCLUDED.subscription_status,
          subscription_starts_at = EXCLUDED.subscription_starts_at,
          subscription_ends_at   = EXCLUDED.subscription_ends_at,
          updated_at             = EXCLUDED.updated_at,
          is_deleted             = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'organizations', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'organizations'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE organizations SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'organizations', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Memberships (client key is 'memberships', NOT 'organization_members') --
  IF changes ? 'memberships' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'memberships'->'created', '[]'::jsonb) ||
      COALESCE(changes->'memberships'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO memberships (
          id, organization_id, user_id, user_email, user_display_name,
          role, invited_by, invited_at, joined_at,
          is_active, is_deleted,
          created_at, updated_at
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          (rec->>'user_id')::uuid,
          rec->>'user_email',
          rec->>'user_display_name',
          rec->>'role',
          NULLIF(rec->>'invited_by',  '')::uuid,
          NULLIF(rec->>'invited_at',  '')::timestamptz,
          NULLIF(rec->>'joined_at',   '')::timestamptz,
          COALESCE((rec->>'is_active')::boolean,  true),
          COALESCE((rec->>'is_deleted')::boolean, false),
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz
        )
        ON CONFLICT (id) DO UPDATE SET
          user_email        = EXCLUDED.user_email,
          user_display_name = EXCLUDED.user_display_name,
          role              = EXCLUDED.role,
          invited_by        = EXCLUDED.invited_by,
          invited_at        = EXCLUDED.invited_at,
          joined_at         = EXCLUDED.joined_at,
          is_active         = EXCLUDED.is_active,
          is_deleted        = EXCLUDED.is_deleted,
          updated_at        = EXCLUDED.updated_at;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'memberships', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'memberships'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE memberships SET is_deleted = true, is_active = false, updated_at = NOW()
        WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'memberships', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Pastures ------------------------------------------------------------
  IF changes ? 'pastures' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'pastures'->'created', '[]'::jsonb) ||
      COALESCE(changes->'pastures'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO pastures (
          id, organization_id, name, code, size_hectares, location_notes,
          forage_type, water_source, fence_type, has_salt_blocks, has_mineral_feeders,
          max_capacity, target_grazing_days, target_rest_days, current_animal_count,
          last_grazed_date, available_from_date, is_active, notes, photos,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'name',
          rec->>'code',
          NULLIF(rec->>'size_hectares',        '')::numeric,
          rec->>'location_notes',
          rec->>'forage_type',
          rec->>'water_source',
          rec->>'fence_type',
          NULLIF(rec->>'has_salt_blocks',      '')::boolean,
          NULLIF(rec->>'has_mineral_feeders',  '')::boolean,
          NULLIF(rec->>'max_capacity',         '')::integer,
          NULLIF(rec->>'target_grazing_days',  '')::integer,
          NULLIF(rec->>'target_rest_days',     '')::integer,
          COALESCE(NULLIF(rec->>'current_animal_count', '')::integer, 0),
          NULLIF(rec->>'last_grazed_date',     '')::timestamptz,
          NULLIF(rec->>'available_from_date',  '')::timestamptz,
          COALESCE((rec->>'is_active')::boolean,  true),
          rec->>'notes',
          rec->>'photos',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          name                 = EXCLUDED.name,
          code                 = EXCLUDED.code,
          size_hectares        = EXCLUDED.size_hectares,
          location_notes       = EXCLUDED.location_notes,
          forage_type          = EXCLUDED.forage_type,
          water_source         = EXCLUDED.water_source,
          fence_type           = EXCLUDED.fence_type,
          has_salt_blocks      = EXCLUDED.has_salt_blocks,
          has_mineral_feeders  = EXCLUDED.has_mineral_feeders,
          max_capacity         = EXCLUDED.max_capacity,
          target_grazing_days  = EXCLUDED.target_grazing_days,
          target_rest_days     = EXCLUDED.target_rest_days,
          current_animal_count = EXCLUDED.current_animal_count,
          last_grazed_date     = EXCLUDED.last_grazed_date,
          available_from_date  = EXCLUDED.available_from_date,
          is_active            = EXCLUDED.is_active,
          notes                = EXCLUDED.notes,
          photos               = EXCLUDED.photos,
          updated_at           = EXCLUDED.updated_at,
          is_deleted           = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'pastures', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'pastures'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE pastures SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'pastures', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Animals -------------------------------------------------------------
  IF changes ? 'animals' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'animals'->'created', '[]'::jsonb) ||
      COALESCE(changes->'animals'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO animals (
          id, organization_id, species, name, visual_tag, rfid_tag,
          breed, sex, date_of_birth, status,
          dam_id, sire_id, registration_number, current_pasture_id, herd_tag,
          notes, photos, tags, genetic_traits,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'species',
          rec->>'name',
          rec->>'visual_tag',
          rec->>'rfid_tag',
          rec->>'breed',
          rec->>'sex',
          NULLIF(rec->>'date_of_birth',       '')::timestamptz,
          rec->>'status',
          NULLIF(rec->>'dam_id',              ''),
          NULLIF(rec->>'sire_id',             ''),
          rec->>'registration_number',
          NULLIF(rec->>'current_pasture_id',  ''),
          rec->>'herd_tag',
          rec->>'notes',
          rec->>'photos',
          COALESCE(NULLIF(rec->>'tags',           '')::jsonb, '[]'::jsonb),
          COALESCE(NULLIF(rec->>'genetic_traits', '')::jsonb, '{}'::jsonb),
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          species             = EXCLUDED.species,
          name                = EXCLUDED.name,
          visual_tag          = EXCLUDED.visual_tag,
          rfid_tag            = EXCLUDED.rfid_tag,
          breed               = EXCLUDED.breed,
          sex                 = EXCLUDED.sex,
          date_of_birth       = EXCLUDED.date_of_birth,
          status              = EXCLUDED.status,
          dam_id              = EXCLUDED.dam_id,
          sire_id             = EXCLUDED.sire_id,
          registration_number = EXCLUDED.registration_number,
          current_pasture_id  = EXCLUDED.current_pasture_id,
          herd_tag            = EXCLUDED.herd_tag,
          notes               = EXCLUDED.notes,
          photos              = EXCLUDED.photos,
          tags                = EXCLUDED.tags,
          genetic_traits      = EXCLUDED.genetic_traits,
          updated_at          = EXCLUDED.updated_at,
          is_deleted          = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'animals', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'animals'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE animals SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'animals', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Treatment Protocols -------------------------------------------------
  IF changes ? 'treatment_protocols' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'treatment_protocols'->'created', '[]'::jsonb) ||
      COALESCE(changes->'treatment_protocols'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO treatment_protocols (
          id, organization_id, name, description, protocol_type,
          product_name, dosage, administration_method, withdrawal_days,
          target_species, target_age_min, target_age_max, is_active,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'name',
          rec->>'description',
          rec->>'protocol_type',
          rec->>'product_name',
          rec->>'dosage',
          rec->>'administration_method',
          NULLIF(rec->>'withdrawal_days',  '')::integer,
          rec->>'target_species',
          NULLIF(rec->>'target_age_min',   '')::integer,
          NULLIF(rec->>'target_age_max',   '')::integer,
          COALESCE((rec->>'is_active')::boolean,  true),
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          name                  = EXCLUDED.name,
          description           = EXCLUDED.description,
          protocol_type         = EXCLUDED.protocol_type,
          product_name          = EXCLUDED.product_name,
          dosage                = EXCLUDED.dosage,
          administration_method = EXCLUDED.administration_method,
          withdrawal_days       = EXCLUDED.withdrawal_days,
          target_species        = EXCLUDED.target_species,
          target_age_min        = EXCLUDED.target_age_min,
          target_age_max        = EXCLUDED.target_age_max,
          is_active             = EXCLUDED.is_active,
          updated_at            = EXCLUDED.updated_at,
          is_deleted            = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'treatment_protocols', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'treatment_protocols'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE treatment_protocols SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'treatment_protocols', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Health Records ------------------------------------------------------
  IF changes ? 'health_records' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'health_records'->'created', '[]'::jsonb) ||
      COALESCE(changes->'health_records'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO health_records (
          id, organization_id, animal_id, protocol_id,
          record_date, record_type, description,
          product_name, dosage, administered_by, withdrawal_date,
          notes, created_by_user_id, created_by_name, photos,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'animal_id',
          NULLIF(rec->>'protocol_id',         ''),
          (rec->>'record_date')::timestamptz,
          rec->>'record_type',
          rec->>'description',
          rec->>'product_name',
          rec->>'dosage',
          rec->>'administered_by',
          NULLIF(rec->>'withdrawal_date',     '')::timestamptz,
          rec->>'notes',
          NULLIF(rec->>'created_by_user_id',  '')::uuid,
          rec->>'created_by_name',
          rec->>'photos',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          protocol_id        = EXCLUDED.protocol_id,
          record_date        = EXCLUDED.record_date,
          record_type        = EXCLUDED.record_type,
          description        = EXCLUDED.description,
          product_name       = EXCLUDED.product_name,
          dosage             = EXCLUDED.dosage,
          administered_by    = EXCLUDED.administered_by,
          withdrawal_date    = EXCLUDED.withdrawal_date,
          notes              = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name    = EXCLUDED.created_by_name,
          photos             = EXCLUDED.photos,
          updated_at         = EXCLUDED.updated_at,
          is_deleted         = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'health_records', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'health_records'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE health_records SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'health_records', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Weight Records ------------------------------------------------------
  IF changes ? 'weight_records' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'weight_records'->'created', '[]'::jsonb) ||
      COALESCE(changes->'weight_records'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO weight_records (
          id, organization_id, animal_id,
          record_date, weight_kg, condition_score,
          notes, created_by_user_id, created_by_name, photos,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'animal_id',
          (rec->>'record_date')::timestamptz,
          (rec->>'weight_kg')::numeric,
          NULLIF(rec->>'condition_score',    '')::integer,
          rec->>'notes',
          NULLIF(rec->>'created_by_user_id', '')::uuid,
          rec->>'created_by_name',
          rec->>'photos',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          record_date        = EXCLUDED.record_date,
          weight_kg          = EXCLUDED.weight_kg,
          condition_score    = EXCLUDED.condition_score,
          notes              = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name    = EXCLUDED.created_by_name,
          photos             = EXCLUDED.photos,
          updated_at         = EXCLUDED.updated_at,
          is_deleted         = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'weight_records', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'weight_records'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE weight_records SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'weight_records', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Breeding Records ----------------------------------------------------
  IF changes ? 'breeding_records' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'breeding_records'->'created', '[]'::jsonb) ||
      COALESCE(changes->'breeding_records'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO breeding_records (
          id, organization_id, animal_id, bull_id,
          breeding_date, method, expected_calving_date, actual_calving_date,
          calf_id, outcome, notes,
          created_by_user_id, created_by_name, photos,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'animal_id',
          NULLIF(rec->>'bull_id',               ''),
          (rec->>'breeding_date')::timestamptz,
          rec->>'method',
          NULLIF(rec->>'expected_calving_date',  '')::timestamptz,
          NULLIF(rec->>'actual_calving_date',    '')::timestamptz,
          NULLIF(rec->>'calf_id',                ''),
          rec->>'outcome',
          rec->>'notes',
          NULLIF(rec->>'created_by_user_id',     '')::uuid,
          rec->>'created_by_name',
          rec->>'photos',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          bull_id               = EXCLUDED.bull_id,
          breeding_date         = EXCLUDED.breeding_date,
          method                = EXCLUDED.method,
          expected_calving_date = EXCLUDED.expected_calving_date,
          actual_calving_date   = EXCLUDED.actual_calving_date,
          calf_id               = EXCLUDED.calf_id,
          outcome               = EXCLUDED.outcome,
          notes                 = EXCLUDED.notes,
          created_by_user_id    = EXCLUDED.created_by_user_id,
          created_by_name       = EXCLUDED.created_by_name,
          photos                = EXCLUDED.photos,
          updated_at            = EXCLUDED.updated_at,
          is_deleted            = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'breeding_records', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'breeding_records'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE breeding_records SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'breeding_records', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Pasture Movements ---------------------------------------------------
  IF changes ? 'pasture_movements' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'pasture_movements'->'created', '[]'::jsonb) ||
      COALESCE(changes->'pasture_movements'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO pasture_movements (
          id, organization_id, pasture_id, animal_id,
          movement_date, movement_type, moved_by, notes,
          created_by_user_id, created_by_name,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'pasture_id',
          rec->>'animal_id',
          (rec->>'movement_date')::timestamptz,
          rec->>'movement_type',
          rec->>'moved_by',
          rec->>'notes',
          NULLIF(rec->>'created_by_user_id', '')::uuid,
          rec->>'created_by_name',
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          pasture_id         = EXCLUDED.pasture_id,
          movement_date      = EXCLUDED.movement_date,
          movement_type      = EXCLUDED.movement_type,
          moved_by           = EXCLUDED.moved_by,
          notes              = EXCLUDED.notes,
          created_by_user_id = EXCLUDED.created_by_user_id,
          created_by_name    = EXCLUDED.created_by_name,
          updated_at         = EXCLUDED.updated_at,
          is_deleted         = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'pasture_movements', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'pasture_movements'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE pasture_movements SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'pasture_movements', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Vaccination Schedules (was entirely absent from old sync_push) -------
  IF changes ? 'vaccination_schedules' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'vaccination_schedules'->'created', '[]'::jsonb) ||
      COALESCE(changes->'vaccination_schedules'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO vaccination_schedules (
          id, organization_id, protocol_id, name, description,
          schedule_type, target_age_months, age_window_days, scheduled_date,
          repeat_annually, pasture_id, interval_months, last_applied_date,
          target_species, target_sex, min_age_months, max_age_months,
          requires_booster, booster_interval_days, booster_count, is_active,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'protocol_id',
          rec->>'name',
          rec->>'description',
          rec->>'schedule_type',
          NULLIF(rec->>'target_age_months',    '')::integer,
          NULLIF(rec->>'age_window_days',      '')::integer,
          NULLIF(rec->>'scheduled_date',       '')::timestamptz,
          COALESCE((rec->>'repeat_annually')::boolean, false),
          NULLIF(rec->>'pasture_id',           ''),
          NULLIF(rec->>'interval_months',      '')::integer,
          NULLIF(rec->>'last_applied_date',    '')::timestamptz,
          rec->>'target_species',
          rec->>'target_sex',
          NULLIF(rec->>'min_age_months',       '')::integer,
          NULLIF(rec->>'max_age_months',       '')::integer,
          COALESCE((rec->>'requires_booster')::boolean, false),
          NULLIF(rec->>'booster_interval_days','')::integer,
          COALESCE(NULLIF(rec->>'booster_count', '')::integer, 1),
          COALESCE((rec->>'is_active')::boolean, true),
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          protocol_id           = EXCLUDED.protocol_id,
          name                  = EXCLUDED.name,
          description           = EXCLUDED.description,
          schedule_type         = EXCLUDED.schedule_type,
          target_age_months     = EXCLUDED.target_age_months,
          age_window_days       = EXCLUDED.age_window_days,
          scheduled_date        = EXCLUDED.scheduled_date,
          repeat_annually       = EXCLUDED.repeat_annually,
          pasture_id            = EXCLUDED.pasture_id,
          interval_months       = EXCLUDED.interval_months,
          last_applied_date     = EXCLUDED.last_applied_date,
          target_species        = EXCLUDED.target_species,
          target_sex            = EXCLUDED.target_sex,
          min_age_months        = EXCLUDED.min_age_months,
          max_age_months        = EXCLUDED.max_age_months,
          requires_booster      = EXCLUDED.requires_booster,
          booster_interval_days = EXCLUDED.booster_interval_days,
          booster_count         = EXCLUDED.booster_count,
          is_active             = EXCLUDED.is_active,
          updated_at            = EXCLUDED.updated_at,
          is_deleted            = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'vaccination_schedules', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'vaccination_schedules'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE vaccination_schedules SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'vaccination_schedules', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  -- ---- Scheduled Vaccinations (was entirely absent from old sync_push) ------
  IF changes ? 'scheduled_vaccinations' THEN
    FOR rec IN SELECT * FROM jsonb_array_elements(
      COALESCE(changes->'scheduled_vaccinations'->'created', '[]'::jsonb) ||
      COALESCE(changes->'scheduled_vaccinations'->'updated', '[]'::jsonb)
    ) LOOP
      BEGIN
        INSERT INTO scheduled_vaccinations (
          id, organization_id, animal_id, schedule_id,
          status, due_date, administered_date, skipped_reason,
          health_record_id, dose_number, parent_vaccination_id,
          created_at, updated_at, is_deleted
        ) VALUES (
          rec->>'id',
          rec->>'organization_id',
          rec->>'animal_id',
          rec->>'schedule_id',
          COALESCE(rec->>'status', 'pending'),
          (rec->>'due_date')::timestamptz,
          NULLIF(rec->>'administered_date',      '')::timestamptz,
          rec->>'skipped_reason',
          NULLIF(rec->>'health_record_id',       ''),
          COALESCE(NULLIF(rec->>'dose_number', '')::integer, 1),
          NULLIF(rec->>'parent_vaccination_id',  ''),
          (rec->>'created_at')::timestamptz,
          (rec->>'updated_at')::timestamptz,
          COALESCE((rec->>'is_deleted')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
          status                = EXCLUDED.status,
          due_date              = EXCLUDED.due_date,
          administered_date     = EXCLUDED.administered_date,
          skipped_reason        = EXCLUDED.skipped_reason,
          health_record_id      = EXCLUDED.health_record_id,
          dose_number           = EXCLUDED.dose_number,
          parent_vaccination_id = EXCLUDED.parent_vaccination_id,
          updated_at            = EXCLUDED.updated_at,
          is_deleted            = EXCLUDED.is_deleted;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'scheduled_vaccinations', 'record_id', rec->>'id', 'error', SQLERRM);
      END;
    END LOOP;

    FOR rec_id IN
      SELECT jsonb_array_elements_text(COALESCE(changes->'scheduled_vaccinations'->'deleted', '[]'::jsonb))
    LOOP
      BEGIN
        UPDATE scheduled_vaccinations SET is_deleted = true, updated_at = NOW() WHERE id = rec_id;
      EXCEPTION WHEN OTHERS THEN
        err_cnt := err_cnt + 1;
        errs := errs || jsonb_build_object('table', 'scheduled_vaccinations', 'record_id', rec_id, 'error', SQLERRM);
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', err_cnt = 0, 'error_count', err_cnt, 'errors', errs);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 5. Replace sync_pull with a corrected version.
--
--    Bugs fixed vs old version:
--    - Organizations: missing subscription_status, subscription_starts_at,
--      subscription_ends_at in jsonb_build_object → those fields never synced
--      to client (RevenueCat subscription updates would be invisible)
--    - scheduled_vaccinations: used correlated subquery via animal_id; table
--      has its own organization_id column — use it directly (simpler + faster)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_pull(last_pulled_at bigint DEFAULT 0)
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
BEGIN
  timestamp_now   := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := to_timestamp(last_pulled_at / 1000.0);
  current_user_id := auth.uid();

  SELECT ARRAY_AGG(DISTINCT organization_id::TEXT) INTO user_org_ids
  FROM memberships
  WHERE user_id = current_user_id AND is_deleted = false AND is_active = true;

  IF user_org_ids IS NULL OR array_length(user_org_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'changes', jsonb_build_object(
        'organizations',         jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'memberships',           jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pastures',              jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'animals',               jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'treatment_protocols',   jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'health_records',        jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'weight_records',        jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'breeding_records',      jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'pasture_movements',     jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'vaccination_schedules', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb),
        'scheduled_vaccinations',jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb, 'deleted', '[]'::jsonb)
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

  -- Memberships
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM memberships WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO updated_records FROM memberships WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM memberships WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'user_id', user_id, 'user_email', user_email, 'user_display_name', user_display_name, 'role', role, 'invited_by', invited_by, 'invited_at', invited_at, 'joined_at', joined_at, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM memberships WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('memberships', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

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
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM animals WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO updated_records FROM animals WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM animals WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'organization_id', organization_id, 'species', species, 'name', name, 'visual_tag', visual_tag, 'rfid_tag', rfid_tag, 'breed', breed, 'sex', sex, 'date_of_birth', date_of_birth, 'status', status, 'dam_id', dam_id, 'sire_id', sire_id, 'registration_number', registration_number, 'current_pasture_id', current_pasture_id, 'herd_tag', herd_tag, 'notes', notes, 'photos', photos, 'tags', tags, 'genetic_traits', genetic_traits, 'created_at', created_at, 'updated_at', updated_at, 'is_deleted', is_deleted)), '[]'::jsonb) INTO created_records FROM animals WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
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

  -- Scheduled Vaccinations (fixed: use direct organization_id filter, not correlated subquery)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations t WHERE created_at > since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO updated_records FROM scheduled_vaccinations t WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) INTO deleted_ids FROM scheduled_vaccinations WHERE updated_at > since_timestamp AND is_deleted = true AND organization_id::TEXT = ANY(user_org_ids);
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO created_records FROM scheduled_vaccinations t WHERE is_deleted = false AND organization_id::TEXT = ANY(user_org_ids);
    updated_records := '[]'::jsonb; deleted_ids := '[]'::jsonb;
  END IF;
  changes := changes || jsonb_build_object('scheduled_vaccinations', jsonb_build_object('created', created_records, 'updated', updated_records, 'deleted', deleted_ids));

  RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);
END;
$function$;
