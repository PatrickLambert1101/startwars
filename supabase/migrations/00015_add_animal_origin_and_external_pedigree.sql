-- Purchased and transferred animals can have known pedigree details even when
-- their parents are not records in the current HerdTrackr organization.
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS external_sire_reference text,
  ADD COLUMN IF NOT EXISTS external_sire_breed text,
  ADD COLUMN IF NOT EXISTS external_dam_reference text,
  ADD COLUMN IF NOT EXISTS external_dam_breed text,
  ADD COLUMN IF NOT EXISTS source_name text;

-- The sync RPCs enumerate columns explicitly. Patch the live function bodies so
-- this migration preserves any deployed changes made after the base sync
-- migration instead of replacing the complete functions with an older copy.
DO $mig$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO def
    FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_push';

  IF def IS NULL THEN
    RAISE EXCEPTION 'sync_push not found';
  END IF;

  IF position('external_sire_reference' in def) = 0 THEN
    def := regexp_replace(
      def,
      'dam_id,\s*sire_id,\s*registration_number,\s*current_pasture_id,\s*herd_tag,',
      'dam_id, sire_id, registration_number, current_pasture_id, herd_tag, external_sire_reference, external_sire_breed, external_dam_reference, external_dam_breed, source_name,'
    );

    def := replace(
      def,
      E'rec->>''herd_tag'',',
      E'rec->>''herd_tag'',\n          rec->>''external_sire_reference'',\n          rec->>''external_sire_breed'',\n          rec->>''external_dam_reference'',\n          rec->>''external_dam_breed'',\n          rec->>''source_name'','
    );

    def := regexp_replace(
      def,
      'herd_tag\s*=\s*EXCLUDED\.herd_tag,',
      'herd_tag = EXCLUDED.herd_tag, external_sire_reference = EXCLUDED.external_sire_reference, external_sire_breed = EXCLUDED.external_sire_breed, external_dam_reference = EXCLUDED.external_dam_reference, external_dam_breed = EXCLUDED.external_dam_breed, source_name = EXCLUDED.source_name,'
    );

    IF position('external_sire_reference' in def) = 0
       OR position('source_name = EXCLUDED.source_name' in def) = 0 THEN
      RAISE EXCEPTION 'Could not patch sync_push animal pedigree anchors';
    END IF;

    EXECUTE def;
  END IF;

  SELECT pg_get_functiondef(oid) INTO def
    FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND proname = 'sync_pull';

  IF def IS NULL THEN
    RAISE EXCEPTION 'sync_pull not found';
  END IF;

  IF position('external_sire_reference' in def) = 0 THEN
    def := replace(
      def,
      E'''registration_number'', registration_number,',
      E'''registration_number'', registration_number, ''external_sire_reference'', external_sire_reference, ''external_sire_breed'', external_sire_breed, ''external_dam_reference'', external_dam_reference, ''external_dam_breed'', external_dam_breed, ''source_name'', source_name,'
    );

    IF position('''external_sire_reference'', external_sire_reference' in def) = 0 THEN
      RAISE EXCEPTION 'Could not patch sync_pull animal pedigree anchors';
    END IF;

    EXECUTE def;
  END IF;
END
$mig$;
