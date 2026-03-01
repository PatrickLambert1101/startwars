-- HerdTrackr Supabase Schema
-- Run this migration to set up the backend tables and RLS policies.

-- ============================================================
-- 1. Organizations
-- ============================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  remote_id text,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

alter table public.organizations enable row level security;

-- ============================================================
-- 2. Organization memberships (link users → orgs)
-- ============================================================
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique(user_id, organization_id)
);

alter table public.memberships enable row level security;

-- Users can see their own memberships
create policy "Users can view own memberships"
  on public.memberships for select
  using (auth.uid() = user_id);

-- Users can insert memberships for themselves (joining an org)
create policy "Users can create own memberships"
  on public.memberships for insert
  with check (auth.uid() = user_id);

-- Org owners/admins can manage memberships
create policy "Admins can manage memberships"
  on public.memberships for all
  using (
    exists (
      select 1 from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- ============================================================
-- 3. Organizations RLS — users can only see orgs they belong to
-- ============================================================
create policy "Users can view their organizations"
  on public.organizations for select
  using (
    exists (
      select 1 from public.memberships
      where memberships.organization_id = organizations.id
        and memberships.user_id = auth.uid()
    )
  );

create policy "Users can create organizations"
  on public.organizations for insert
  with check (true);

create policy "Members can update their organizations"
  on public.organizations for update
  using (
    exists (
      select 1 from public.memberships
      where memberships.organization_id = organizations.id
        and memberships.user_id = auth.uid()
        and memberships.role in ('owner', 'admin')
    )
  );

-- ============================================================
-- 4. Animals
-- ============================================================
create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  remote_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rfid_tag text not null,
  visual_tag text not null,
  name text,
  breed text not null,
  sex text not null check (sex in ('bull', 'cow', 'steer', 'heifer', 'calf')),
  date_of_birth timestamptz,
  sire_id uuid references public.animals(id),
  dam_id uuid references public.animals(id),
  registration_number text,
  status text not null default 'active' check (status in ('active', 'sold', 'deceased', 'transferred')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index idx_animals_org on public.animals(organization_id);
create index idx_animals_rfid on public.animals(rfid_tag);

alter table public.animals enable row level security;

create policy "Users can access animals in their orgs"
  on public.animals for all
  using (
    exists (
      select 1 from public.memberships
      where memberships.organization_id = animals.organization_id
        and memberships.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. Health Records
-- ============================================================
create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  remote_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  record_date timestamptz not null,
  record_type text not null check (record_type in ('vaccination', 'treatment', 'vet_visit', 'condition_score', 'other')),
  description text not null,
  product_name text,
  dosage text,
  administered_by text,
  withdrawal_date timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index idx_health_org on public.health_records(organization_id);
create index idx_health_animal on public.health_records(animal_id);

alter table public.health_records enable row level security;

create policy "Users can access health records in their orgs"
  on public.health_records for all
  using (
    exists (
      select 1 from public.memberships
      where memberships.organization_id = health_records.organization_id
        and memberships.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Weight Records
-- ============================================================
create table if not exists public.weight_records (
  id uuid primary key default gen_random_uuid(),
  remote_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  record_date timestamptz not null,
  weight_kg numeric not null,
  condition_score integer check (condition_score between 1 and 9),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index idx_weight_org on public.weight_records(organization_id);
create index idx_weight_animal on public.weight_records(animal_id);

alter table public.weight_records enable row level security;

create policy "Users can access weight records in their orgs"
  on public.weight_records for all
  using (
    exists (
      select 1 from public.memberships
      where memberships.organization_id = weight_records.organization_id
        and memberships.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. Breeding Records
-- ============================================================
create table if not exists public.breeding_records (
  id uuid primary key default gen_random_uuid(),
  remote_id text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  bull_id uuid references public.animals(id),
  breeding_date timestamptz not null,
  method text not null check (method in ('natural', 'ai', 'embryo_transfer')),
  expected_calving_date timestamptz,
  actual_calving_date timestamptz,
  calf_id uuid references public.animals(id),
  outcome text not null default 'pending' check (outcome in ('pending', 'live_calf', 'stillborn', 'aborted', 'open')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index idx_breeding_org on public.breeding_records(organization_id);
create index idx_breeding_animal on public.breeding_records(animal_id);

alter table public.breeding_records enable row level security;

create policy "Users can access breeding records in their orgs"
  on public.breeding_records for all
  using (
    exists (
      select 1 from public.memberships
      where memberships.organization_id = breeding_records.organization_id
        and memberships.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. Auto-update updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger animals_updated_at before update on public.animals
  for each row execute function public.set_updated_at();

create trigger health_records_updated_at before update on public.health_records
  for each row execute function public.set_updated_at();

create trigger weight_records_updated_at before update on public.weight_records
  for each row execute function public.set_updated_at();

create trigger breeding_records_updated_at before update on public.breeding_records
  for each row execute function public.set_updated_at();

-- ============================================================
-- 9. Helper: auto-create membership when org is created
-- ============================================================
create or replace function public.auto_add_org_owner()
returns trigger as $$
begin
  insert into public.memberships (user_id, organization_id, role)
  values (auth.uid(), new.id, 'owner');
  return new;
end;
$$ language plpgsql security definer;

create trigger org_auto_membership after insert on public.organizations
  for each row execute function public.auto_add_org_owner();
