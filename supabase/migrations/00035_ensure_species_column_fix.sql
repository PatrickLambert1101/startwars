-- Ensure species column exists in animals table
ALTER TABLE animals ADD COLUMN IF NOT EXISTS species TEXT NOT NULL DEFAULT 'cattle';

-- Update any NULL species to 'cattle'
UPDATE animals SET species = 'cattle' WHERE species IS NULL OR species = '';

-- Recreate the sync_pull function to ensure it includes species
-- This is a simplified version that ensures species is included
CREATE OR REPLACE FUNCTION public.sync_pull(last_pulled_at BIGINT DEFAULT 0)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  timestamp_now BIGINT;
  since_timestamp TIMESTAMPTZ;
  changes JSONB := '{}'::jsonb;
  created_records JSONB;
  updated_records JSONB;
  deleted_ids JSONB;
BEGIN
  timestamp_now := CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
  since_timestamp := to_timestamp(last_pulled_at / 1000.0);

  -- ANIMALS (with species column explicitly included)
  IF last_pulled_at > 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id,
      'organization_id', organization_id,
      'species', COALESCE(species, 'cattle'),
      'name', name,
      'visual_tag', visual_tag,
      'rfid_tag', rfid_tag,
      'breed', breed,
      'sex', sex,
      'date_of_birth', date_of_birth,
      'status', status,
      'dam_id', dam_id,
      'sire_id', sire_id,
      'registration_number', registration_number,
      'current_pasture_id', current_pasture_id,
      'herd_tag', herd_tag,
      'notes', notes,
      'photos', photos,
      'tags', tags,
      'created_at', created_at,
      'updated_at', updated_at,
      'is_deleted', is_deleted,
      'remote_id', remote_id
    )), '[]'::jsonb)
    INTO created_records
    FROM animals
    WHERE created_at > since_timestamp AND is_deleted = false;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id,
      'organization_id', organization_id,
      'species', COALESCE(species, 'cattle'),
      'name', name,
      'visual_tag', visual_tag,
      'rfid_tag', rfid_tag,
      'breed', breed,
      'sex', sex,
      'date_of_birth', date_of_birth,
      'status', status,
      'dam_id', dam_id,
      'sire_id', sire_id,
      'registration_number', registration_number,
      'current_pasture_id', current_pasture_id,
      'herd_tag', herd_tag,
      'notes', notes,
      'photos', photos,
      'tags', tags,
      'created_at', created_at,
      'updated_at', updated_at,
      'is_deleted', is_deleted,
      'remote_id', remote_id
    )), '[]'::jsonb)
    INTO updated_records
    FROM animals
    WHERE updated_at > since_timestamp AND created_at <= since_timestamp AND is_deleted = false;

    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
    INTO deleted_ids
    FROM animals
    WHERE updated_at > since_timestamp AND is_deleted = true;
  ELSE
    -- First sync: pull everything
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id,
      'organization_id', organization_id,
      'species', COALESCE(species, 'cattle'),
      'name', name,
      'visual_tag', visual_tag,
      'rfid_tag', rfid_tag,
      'breed', breed,
      'sex', sex,
      'date_of_birth', date_of_birth,
      'status', status,
      'dam_id', dam_id,
      'sire_id', sire_id,
      'registration_number', registration_number,
      'current_pasture_id', current_pasture_id,
      'herd_tag', herd_tag,
      'notes', notes,
      'photos', photos,
      'tags', tags,
      'created_at', created_at,
      'updated_at', updated_at,
      'is_deleted', is_deleted,
      'remote_id', remote_id
    )), '[]'::jsonb)
    INTO created_records
    FROM animals
    WHERE is_deleted = false;

    updated_records := '[]'::jsonb;
    deleted_ids := '[]'::jsonb;
  END IF;

  changes := changes || jsonb_build_object('animals', jsonb_build_object(
    'created', created_records,
    'updated', updated_records,
    'deleted', deleted_ids
  ));

  RETURN jsonb_build_object(
    'changes', changes,
    'timestamp', timestamp_now
  );
END;
$$ LANGUAGE plpgsql;
