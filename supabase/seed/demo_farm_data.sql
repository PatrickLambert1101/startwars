-- ============================================================
-- HerdTrackr Demo Seed Data
-- ============================================================
-- A realistic South African mixed cattle farm ("Bosveld Plaas")
-- located in Limpopo province.
--
-- Creates:
--   1 demo user  (demo@herdtrackr.app / DemoFarm123!)
--   1 organization
--   ~50 animals  (Bonsmara, Nguni, Brahman, Drakensberger mix)
--   Health records, weight records, breeding records
--
-- HOW TO RUN:
--   1. Open the Supabase SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--
-- NOTE: If you've already run this script, it is idempotent —
-- existing rows with the same IDs will be skipped.
-- ============================================================

-- ── 0. Create demo user via Supabase Auth ───────────────────
-- This inserts directly into auth.users. If you prefer, you can
-- create the user through the Auth UI and replace the UUID below.
-- Password: DemoFarm123!

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@herdtrackr.app') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      '00000000-0000-0000-0000-000000000000',
      'demo@herdtrackr.app',
      crypt('DemoFarm123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Pieter van der Merwe"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      '',
      ''
    );

    -- Also create the identity record so email login works
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      jsonb_build_object('sub', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'email', 'demo@herdtrackr.app'),
      'email',
      'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      now(),
      now(),
      now()
    );
  END IF;
END $$;


-- ── 1. Organization ─────────────────────────────────────────
INSERT INTO public.organizations (id, name, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Bosveld Plaas',
  now() - interval '2 years',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Membership (owner) ───────────────────────────────────
INSERT INTO public.memberships (user_id, organization_id, role)
VALUES (
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '11111111-1111-1111-1111-111111111111',
  'owner'
)
ON CONFLICT (user_id, organization_id) DO NOTHING;


-- ── 3. Animals ──────────────────────────────────────────────
-- Naming: farm tag prefix BV (Bosveld), sequential number
-- Mix of Bonsmara, Nguni, Brahman, Drakensberger, and a few crossbreeds

-- === BULLS (4) ===
INSERT INTO public.animals (id, organization_id, rfid_tag, visual_tag, name, breed, sex, date_of_birth, status, notes, created_at, updated_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '982000000000001', 'BV-001', 'Stormjaer',   'Bonsmara',       'bull', '2020-03-15', 'active', 'Herd bull. Excellent temperament, strong calves.', now() - interval '18 months', now()),
  ('b0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '982000000000002', 'BV-002', 'Donker',      'Drakensberger',  'bull', '2019-08-22', 'active', 'Senior bull. Proven breeder, hardy in drought.', now() - interval '18 months', now()),
  ('b0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '982000000000003', 'BV-003', 'Blitz',       'Brahman',        'bull', '2021-01-10', 'active', 'Young bull. Heat tolerant, tick resistant.', now() - interval '12 months', now()),
  ('b0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '982000000000004', 'BV-004', 'Rooibos',     'Nguni',          'bull', '2021-06-05', 'active', 'Nguni bull. Compact build, excellent forager.', now() - interval '10 months', now())
ON CONFLICT (id) DO NOTHING;

-- === COWS (25) ===
INSERT INTO public.animals (id, organization_id, rfid_tag, visual_tag, name, breed, sex, date_of_birth, sire_id, status, notes, created_at, updated_at) VALUES
  ('c0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '982000000000101', 'BV-101', 'Liesel',     'Bonsmara',       'cow', '2018-09-12', NULL, 'active', 'Lead cow. Excellent mother, consistent producer.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '982000000000102', 'BV-102', 'Sarie',      'Bonsmara',       'cow', '2019-02-28', NULL, 'active', 'Calm temperament, easy calver.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '982000000000103', 'BV-103', 'Marietjie',  'Bonsmara',       'cow', '2019-07-14', NULL, 'active', 'High milk yield.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '982000000000104', 'BV-104', 'Nandi',      'Nguni',          'cow', '2018-11-03', NULL, 'active', 'Beautiful inkone pattern. Strong calves.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '982000000000105', 'BV-105', 'Thandi',     'Nguni',          'cow', '2019-04-20', NULL, 'active', 'Multi-coloured, disease resistant.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '982000000000106', 'BV-106', 'Nomsa',      'Nguni',          'cow', '2020-01-08', NULL, 'active', 'First-calf heifer graduated to cow.', now() - interval '14 months', now()),
  ('c0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '982000000000107', 'BV-107', 'Bella',      'Brahman',        'cow', '2018-06-25', NULL, 'active', 'Grey Brahman. Very heat tolerant.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '982000000000108', 'BV-108', 'Priya',      'Brahman',        'cow', '2019-10-17', NULL, 'active', 'Red Brahman. Excellent feet.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', '982000000000109', 'BV-109', 'Grietjie',   'Drakensberger',  'cow', '2019-03-30', NULL, 'active', 'Hardy, does well on sourveld.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', '982000000000110', 'BV-110', 'Swartjie',   'Drakensberger',  'cow', '2018-12-14', NULL, 'active', 'Solid black. Top weaning weight.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', '982000000000111', 'BV-111', 'Daisy',      'Bonsmara',       'cow', '2020-05-22', NULL, 'active', 'Daughter of BV-101.', now() - interval '12 months', now()),
  ('c0000001-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', '982000000000112', 'BV-112', 'Lerato',     'Nguni',          'cow', '2020-08-09', NULL, 'active', 'Spotted pattern, gentle nature.', now() - interval '12 months', now()),
  ('c0000001-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', '982000000000113', 'BV-113', 'Komati',     'Bonsmara',       'cow', '2019-11-28', NULL, 'active', 'Named after the river. Good frame.', now() - interval '16 months', now()),
  ('c0000001-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', '982000000000114', 'BV-114', 'Palesa',     'Nguni',          'cow', '2020-02-14', NULL, 'active', 'Small frame but great milk.', now() - interval '14 months', now()),
  ('c0000001-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', '982000000000115', 'BV-115', 'Mopani',     'Brahman',        'cow', '2020-04-03', NULL, 'active', 'Named after the trees in camp 3.', now() - interval '14 months', now()),
  ('c0000001-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', '982000000000116', 'BV-116', 'Annika',     'Bonsmara',       'cow', '2019-06-18', NULL, 'active', NULL, now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', '982000000000117', 'BV-117', 'Bokkie',     'Drakensberger',  'cow', '2020-09-21', NULL, 'active', NULL, now() - interval '10 months', now()),
  ('c0000001-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', '982000000000118', 'BV-118', 'Lena',       'Bonsmara',       'cow', '2018-07-04', NULL, 'active', 'Oldest producing cow in the herd.', now() - interval '18 months', now()),
  ('c0000001-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', '982000000000119', 'BV-119', 'Sindiswa',   'Nguni',          'cow', '2020-11-11', NULL, 'active', NULL, now() - interval '10 months', now()),
  ('c0000001-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', '982000000000120', 'BV-120', 'Willemien',  'Bonsmara',       'cow', '2019-12-25', NULL, 'active', 'Christmas calf grown up.', now() - interval '16 months', now()),
  ('c0000001-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', '982000000000121', 'BV-121', 'Mpho',       'Nguni',          'cow', '2021-03-17', NULL, 'active', 'Young cow, first breeding season.', now() - interval '8 months', now()),
  ('c0000001-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', '982000000000122', 'BV-122', 'Rooinek',    'Bonsmara',       'cow', '2020-07-30', NULL, 'active', NULL, now() - interval '12 months', now()),
  ('c0000001-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', '982000000000123', 'BV-123', 'Kiepie',     'Brahman',        'cow', '2021-01-05', NULL, 'active', 'Smallest in the group but feisty.', now() - interval '8 months', now()),
  ('c0000001-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111111', '982000000000124', 'BV-124', 'Sannie',     'Drakensberger',  'cow', '2020-06-12', NULL, 'active', NULL, now() - interval '12 months', now()),
  ('c0000001-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111', '982000000000125', 'BV-125', 'Makhosi',    'Nguni',          'cow', '2019-09-08', NULL, 'active', 'Excellent on veld, never needs supplement.', now() - interval '16 months', now())
ON CONFLICT (id) DO NOTHING;

-- === HEIFERS (8) ===
INSERT INTO public.animals (id, organization_id, rfid_tag, visual_tag, name, breed, sex, date_of_birth, sire_id, dam_id, status, notes, created_at, updated_at) VALUES
  ('h0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '982000000000201', 'BV-201', 'Louisa',     'Bonsmara',       'female', '2023-08-15', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'active', 'Promising heifer from top cow.', now() - interval '6 months', now()),
  ('h0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '982000000000202', 'BV-202', 'Zodwa',      'Nguni',          'female', '2023-09-02', 'b0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000004', 'active', 'Retained for breeding.', now() - interval '6 months', now()),
  ('h0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '982000000000203', 'BV-203', 'Karien',     'Bonsmara',       'female', '2023-07-20', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002', 'active', NULL, now() - interval '6 months', now()),
  ('h0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '982000000000204', 'BV-204', 'Buhle',      'Nguni',          'female', '2023-10-11', 'b0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000005', 'active', NULL, now() - interval '5 months', now()),
  ('h0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '982000000000205', 'BV-205', 'Elsie',      'Drakensberger',  'female', '2023-06-30', 'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000009', 'active', NULL, now() - interval '6 months', now()),
  ('h0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '982000000000206', 'BV-206', 'Precious',   'Brahman',        'female', '2023-11-08', 'b0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000007', 'active', NULL, now() - interval '4 months', now()),
  ('h0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '982000000000207', 'BV-207', 'Tannie',     'Bonsmara',       'female', '2023-08-28', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003', 'active', NULL, now() - interval '6 months', now()),
  ('h0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '982000000000208', 'BV-208', 'Mapula',     'Nguni',          'female', '2023-12-01', 'b0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000012', 'active', NULL, now() - interval '3 months', now())
ON CONFLICT (id) DO NOTHING;

-- === STEERS / OXEN (8) ===
INSERT INTO public.animals (id, organization_id, rfid_tag, visual_tag, name, breed, sex, date_of_birth, sire_id, dam_id, status, notes, created_at, updated_at) VALUES
  ('s0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '982000000000301', 'BV-301', NULL, 'Bonsmara',       'castrated', '2023-07-10', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000011', 'active', 'Feedlot group 1. Target 450kg.', now() - interval '6 months', now()),
  ('s0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '982000000000302', 'BV-302', NULL, 'Bonsmara',       'castrated', '2023-08-02', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000013', 'active', 'Feedlot group 1.', now() - interval '6 months', now()),
  ('s0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '982000000000303', 'BV-303', NULL, 'Nguni',          'castrated', '2023-09-14', 'b0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000014', 'active', 'Feedlot group 2.', now() - interval '5 months', now()),
  ('s0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '982000000000304', 'BV-304', NULL, 'Brahman',        'castrated', '2023-06-18', 'b0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000008', 'active', 'Feedlot group 1. Growing well.', now() - interval '6 months', now()),
  ('s0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '982000000000305', 'BV-305', NULL, 'Drakensberger',  'castrated', '2023-10-25', 'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000010', 'active', 'Feedlot group 2.', now() - interval '4 months', now()),
  ('s0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '982000000000306', 'BV-306', NULL, 'Bonsmara',       'castrated', '2023-11-30', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000016', 'active', 'Feedlot group 2.', now() - interval '3 months', now()),
  ('s0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '982000000000307', 'BV-307', NULL, 'Nguni',          'castrated', '2023-07-22', 'b0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000019', 'active', 'Feedlot group 1.', now() - interval '6 months', now()),
  ('s0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '982000000000308', 'BV-308', NULL, 'Bonsmara',       'castrated', '2023-08-19', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000020', 'active', NULL, now() - interval '6 months', now())
ON CONFLICT (id) DO NOTHING;

-- === SOLD / DECEASED (5) ===
INSERT INTO public.animals (id, organization_id, rfid_tag, visual_tag, name, breed, sex, date_of_birth, status, notes, created_at, updated_at) VALUES
  ('d0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '982000000000401', 'BV-401', NULL,    'Bonsmara',  'castrated', '2022-06-10', 'sold',     'Sold to Vleissentraal auction, Polokwane. R18,500.', now() - interval '18 months', now() - interval '2 months'),
  ('d0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '982000000000402', 'BV-402', NULL,    'Nguni',     'castrated', '2022-07-22', 'sold',     'Sold private, R16,200.', now() - interval '18 months', now() - interval '3 months'),
  ('d0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '982000000000403', 'BV-403', NULL,    'Brahman',   'castrated', '2022-08-14', 'sold',     'Sold Vleissentraal, R17,800.', now() - interval '18 months', now() - interval '1 month'),
  ('d0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '982000000000404', 'BV-404', 'Ouma',  'Bonsmara',  'cow',       '2014-03-05', 'deceased', 'Old age / natural causes. Great producer in her time.', now() - interval '18 months', now() - interval '4 months'),
  ('d0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '982000000000405', 'BV-405', NULL,    'Nguni',     'female',    '2023-01-20', 'deceased', 'Calf lost to heartwater. Treated too late.', now() - interval '10 months', now() - interval '7 months')
ON CONFLICT (id) DO NOTHING;


-- ── 4. Health Records ───────────────────────────────────────
-- Typical SA cattle health programme: Lumpy Skin, Blackquarter,
-- Botulism, Anthrax, Brucellosis (heifers), dipping, deworming.

INSERT INTO public.health_records (id, organization_id, animal_id, record_date, record_type, description, product_name, dosage, administered_by, withdrawal_date, notes, created_at, updated_at) VALUES
  -- Annual vaccinations (batch — applied to several animals)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', '2025-03-10', 'vaccination', 'Lumpy Skin Disease vaccine', 'Lumpyvax', '5ml SC', 'Dr. Malan (State Vet)', '2025-03-31', 'Annual spring vaccination round.', now() - interval '12 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', '2025-03-10', 'vaccination', 'Lumpy Skin Disease vaccine', 'Lumpyvax', '5ml SC', 'Dr. Malan (State Vet)', '2025-03-31', NULL, now() - interval '12 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000002', '2025-03-10', 'vaccination', 'Lumpy Skin Disease vaccine', 'Lumpyvax', '5ml SC', 'Dr. Malan (State Vet)', '2025-03-31', NULL, now() - interval '12 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000004', '2025-03-10', 'vaccination', 'Lumpy Skin Disease vaccine', 'Lumpyvax', '5ml SC', 'Dr. Malan (State Vet)', '2025-03-31', NULL, now() - interval '12 months', now()),

  -- Blackquarter + Botulism combo
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', '2025-02-15', 'vaccination', 'Blackquarter + Botulism', 'Supavax', '5ml SC', 'Pieter (owner)', NULL, 'Given with annual booster.', now() - interval '13 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', '2025-02-15', 'vaccination', 'Blackquarter + Botulism', 'Supavax', '5ml SC', 'Pieter (owner)', NULL, NULL, now() - interval '13 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000007', '2025-02-15', 'vaccination', 'Blackquarter + Botulism', 'Supavax', '5ml SC', 'Pieter (owner)', NULL, NULL, now() - interval '13 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000010', '2025-02-15', 'vaccination', 'Blackquarter + Botulism', 'Supavax', '5ml SC', 'Pieter (owner)', NULL, NULL, now() - interval '13 months', now()),

  -- Brucellosis (heifers 4-8 months)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'h0000001-0000-0000-0000-000000000001', '2024-02-20', 'vaccination', 'Brucellosis S19', 'Brucella S19', '2ml SC', 'Dr. Malan (State Vet)', NULL, 'Compulsory heifer vaccination. Ear-notched.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'h0000001-0000-0000-0000-000000000002', '2024-02-20', 'vaccination', 'Brucellosis S19', 'Brucella S19', '2ml SC', 'Dr. Malan (State Vet)', NULL, 'Compulsory. Ear-notched.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'h0000001-0000-0000-0000-000000000003', '2024-02-20', 'vaccination', 'Brucellosis S19', 'Brucella S19', '2ml SC', 'Dr. Malan (State Vet)', NULL, NULL, now() - interval '6 months', now()),

  -- Deworming
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'h0000001-0000-0000-0000-000000000001', '2025-06-01', 'treatment', 'Deworming — broad spectrum', 'Valbazen', '10ml oral', 'Pieter (owner)', '2025-06-15', 'Pre-winter deworming round.', now() - interval '9 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'h0000001-0000-0000-0000-000000000002', '2025-06-01', 'treatment', 'Deworming — broad spectrum', 'Valbazen', '10ml oral', 'Pieter (owner)', '2025-06-15', NULL, now() - interval '9 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000001', '2025-06-01', 'treatment', 'Deworming — broad spectrum', 'Valbazen', '10ml oral', 'Pieter (owner)', '2025-06-15', NULL, now() - interval '9 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000002', '2025-06-01', 'treatment', 'Deworming — broad spectrum', 'Valbazen', '10ml oral', 'Pieter (owner)', '2025-06-15', NULL, now() - interval '9 months', now()),

  -- Tick dipping
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', '2025-11-20', 'treatment', 'Tick dipping — pour-on', 'Drastic Deadline', 'Pour-on 20ml', 'Pieter (owner)', NULL, 'Rainy season dip cycle 1 of 4.', now() - interval '4 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', '2025-11-20', 'treatment', 'Tick dipping — pour-on', 'Drastic Deadline', 'Pour-on 15ml', 'Pieter (owner)', NULL, NULL, now() - interval '4 months', now()),

  -- Vet visit / treatment
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000007', '2025-09-05', 'vet_visit', 'Abscess on jaw — lanced and drained', NULL, NULL, 'Dr. Malan (State Vet)', NULL, 'Wooden tongue suspected. Sent sample for lab. Iodine treatment started.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000015', '2025-10-12', 'treatment', 'Retained afterbirth treatment', 'Penstrep LA', '20ml IM', 'Pieter (owner)', '2025-10-26', 'Afterbirth removed manually. Antibiotic course.', now() - interval '5 months', now()),

  -- Condition scoring
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', '2025-12-01', 'condition_score', 'Body condition score assessment', NULL, NULL, 'Pieter (owner)', NULL, 'Score 7/9. Bull in good condition for breeding season.', now() - interval '3 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', '2025-12-01', 'condition_score', 'Body condition score assessment', NULL, NULL, 'Pieter (owner)', NULL, 'Score 6/9. Acceptable, will supplement with lick.', now() - interval '3 months', now())
ON CONFLICT (id) DO NOTHING;


-- ── 5. Weight Records ───────────────────────────────────────
-- Quarterly weigh-ins plus weaning weights

INSERT INTO public.weight_records (id, organization_id, animal_id, record_date, weight_kg, condition_score, notes, created_at, updated_at) VALUES
  -- Bull weights (quarterly)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', '2025-03-15', 820, 7, 'Post-summer weight.', now() - interval '12 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', '2025-06-15', 805, 6, 'Winter dip. Normal.', now() - interval '9 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', '2025-09-15', 830, 7, 'Recovered well.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', '2025-12-15', 845, 7, 'Peak condition for breeding.', now() - interval '3 months', now()),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000002', '2025-03-15', 780, 6, NULL, now() - interval '12 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000002', '2025-06-15', 760, 6, NULL, now() - interval '9 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000002', '2025-09-15', 790, 7, NULL, now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000002', '2025-12-15', 800, 7, NULL, now() - interval '3 months', now()),

  -- Cow weights (select cows, quarterly)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', '2025-03-15', 520, 6, NULL, now() - interval '12 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', '2025-06-15', 495, 5, 'Lost condition nursing calf.', now() - interval '9 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', '2025-09-15', 510, 6, 'Calf weaned, cow recovering.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', '2025-12-15', 530, 6, NULL, now() - interval '3 months', now()),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000004', '2025-03-15', 410, 6, 'Nguni — smaller frame, good condition.', now() - interval '12 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000004', '2025-06-15', 395, 5, NULL, now() - interval '9 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000004', '2025-09-15', 415, 6, NULL, now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000004', '2025-12-15', 420, 6, NULL, now() - interval '3 months', now()),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000010', '2025-03-15', 540, 7, 'Top-performing Drakensberger cow.', now() - interval '12 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000010', '2025-06-15', 520, 6, NULL, now() - interval '9 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000010', '2025-09-15', 545, 7, NULL, now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000010', '2025-12-15', 555, 7, NULL, now() - interval '3 months', now()),

  -- Weaning weights (calves at ~7 months)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'h0000001-0000-0000-0000-000000000001', '2024-03-15', 205, 6, 'Weaning weight. Above average.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'h0000001-0000-0000-0000-000000000002', '2024-04-02', 180, 5, 'Weaning weight. Nguni — lighter frame expected.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'h0000001-0000-0000-0000-000000000003', '2024-02-20', 210, 6, 'Weaning weight.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000001', '2024-02-10', 215, 6, 'Weaning weight. Good growth.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000002', '2024-03-02', 200, 5, 'Weaning weight.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000003', '2024-04-14', 175, 5, 'Weaning weight. Nguni steer.', now() - interval '6 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000004', '2024-01-18', 220, 6, 'Weaning weight. Brahman cross, heavy.', now() - interval '6 months', now()),

  -- Post-weaning feedlot weights (steers growing)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000001', '2024-05-10', 280, 6, 'Feedlot 90-day weigh.', now() - interval '4 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000001', '2025-12-15', 380, 7, 'On track for target.', now() - interval '3 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000004', '2024-04-18', 290, 6, 'Feedlot 90-day weigh.', now() - interval '4 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000004', '2025-12-15', 400, 7, 'Brahman — fast grower.', now() - interval '3 months', now())
ON CONFLICT (id) DO NOTHING;


-- ── 6. Breeding Records ─────────────────────────────────────
INSERT INTO public.breeding_records (id, organization_id, animal_id, bull_id, breeding_date, method, expected_calving_date, actual_calving_date, calf_id, outcome, notes, created_at, updated_at) VALUES
  -- Successful calvings (last season)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '2022-12-15', 'natural', '2023-09-15', '2023-08-15', 'h0000001-0000-0000-0000-000000000001', 'live_calf', 'Easy calving. Heifer calf retained.', now() - interval '18 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', '2022-12-20', 'natural', '2023-09-20', '2023-08-02', 's0000001-0000-0000-0000-000000000002', 'live_calf', 'Bull calf, castrated at 3 months.', now() - interval '18 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', '2023-01-05', 'natural', '2023-10-05', '2023-09-02', 'h0000001-0000-0000-0000-000000000002', 'live_calf', 'Nguni x Nguni. Beautiful markings.', now() - interval '18 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000002', '2022-11-10', 'natural', '2023-08-10', '2023-06-30', 'h0000001-0000-0000-0000-000000000005', 'live_calf', 'Early calver. Heifer retained.', now() - interval '18 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000011', 'b0000001-0000-0000-0000-000000000001', '2022-12-10', 'natural', '2023-09-10', '2023-07-10', 's0000001-0000-0000-0000-000000000001', 'live_calf', 'Bull calf — feedlot.', now() - interval '18 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000003', '2023-02-15', 'natural', '2023-11-15', '2023-11-08', 'h0000001-0000-0000-0000-000000000006', 'live_calf', 'Brahman heifer.', now() - interval '14 months', now()),

  -- AI breeding
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', '2023-01-08', 'ai', '2023-10-08', '2023-08-28', 'h0000001-0000-0000-0000-000000000007', 'live_calf', 'AI with Stormjaer semen. Good result.', now() - interval '18 months', now()),

  -- Current season — pending
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '2025-12-18', 'natural', '2026-09-18', NULL, NULL, 'pending', 'Confirmed pregnant via rectal palpation.', now() - interval '3 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', '2025-12-22', 'natural', '2026-09-22', NULL, NULL, 'pending', 'Confirmed pregnant.', now() - interval '3 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', '2025-12-28', 'natural', '2026-09-28', NULL, NULL, 'pending', 'Confirmed pregnant.', now() - interval '3 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000004', '2026-01-05', 'natural', '2026-10-05', NULL, NULL, 'pending', 'Bull seen with cow. Awaiting pregnancy test.', now() - interval '2 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000010', 'b0000001-0000-0000-0000-000000000002', '2025-12-20', 'natural', '2026-09-20', NULL, NULL, 'pending', 'Confirmed pregnant. Third calf.', now() - interval '3 months', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000018', 'b0000001-0000-0000-0000-000000000001', '2026-01-10', 'natural', '2026-10-10', NULL, NULL, 'pending', NULL, now() - interval '2 months', now()),

  -- Open (not pregnant)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000017', 'b0000001-0000-0000-0000-000000000002', '2025-12-15', 'natural', '2026-09-15', NULL, NULL, 'open', 'Tested open at 60 days. Will re-breed next cycle.', now() - interval '3 months', now()),

  -- Stillborn
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000015', 'b0000001-0000-0000-0000-000000000003', '2025-01-20', 'natural', '2025-10-20', '2025-10-12', NULL, 'stillborn', 'Dystocia — calf too large. Cow treated for retained afterbirth.', now() - interval '14 months', now())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Done! Your demo farm "Bosveld Plaas" is ready.
--
-- Sign in with:
--   Email:    demo@herdtrackr.app
--   Password: DemoFarm123!
--
-- You should see:
--   - 50 animals (4 bulls, 25 cows, 8 heifers, 8 steers, 5 sold/deceased)
--   - Vaccination, treatment, and deworming records
--   - Quarterly weight data with condition scores
--   - Breeding records with pending pregnancies
-- ============================================================
