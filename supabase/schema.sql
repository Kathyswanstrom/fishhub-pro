-- FishHub.pro / F.I.S.H. Supabase Schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  launch_location text,
  crew text,
  route_geojson jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists catches (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete set null,
  species text not null check (species in ('halibut','salmon','crab','other')),
  species_detail text,
  length_inches numeric,
  girth_inches numeric,
  estimated_weight_lbs numeric,
  estimated_yield_lbs numeric,
  yield_percent numeric default 50,
  location_name text not null,
  latitude numeric,
  longitude numeric,
  depth_ft numeric,
  caught_at timestamptz not null,
  bait text,
  lure_color text,
  tide_station_id text,
  tide_station_name text,
  high_tide text,
  low_tide text,
  weather_summary text,
  captain_notes text,
  photo_url text,
  privacy_level text default 'private' check (privacy_level in ('private','crew','approximate','public')),
  created_at timestamptz not null default now()
);

create table if not exists crab_pots (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete set null,
  pot_number text not null,
  location_name text not null,
  latitude numeric,
  longitude numeric,
  depth_ft numeric,
  bait text,
  dropped_at timestamptz not null,
  pulled_at timestamptz,
  soak_hours numeric,
  keepers integer default 0,
  shorts integer default 0,
  females integer default 0,
  soft_shell integer default 0,
  bottom_type text,
  notes text,
  photo_url text,
  privacy_level text default 'private' check (privacy_level in ('private','crew','approximate','public')),
  created_at timestamptz not null default now()
);

create table if not exists smart_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text not null check (species in ('halibut','salmon','crab','other')),
  latitude numeric,
  longitude numeric,
  depth_ft numeric,
  best_tide_window text,
  best_bait text,
  confidence_score numeric default 0,
  productivity_notes text,
  privacy_level text default 'private' check (privacy_level in ('private','crew','approximate','public')),
  created_at timestamptz not null default now()
);

create table if not exists instruction_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  species text,
  video_url text,
  thumbnail_url text,
  duration_seconds integer,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists processing_inventory (
  id uuid primary key default gen_random_uuid(),
  catch_id uuid references catches(id) on delete set null,
  species text,
  package_type text,
  package_count integer default 1,
  total_weight_lbs numeric,
  freezer_location text,
  processed_at timestamptz default now(),
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- Photo storage bucket
insert into storage.buckets (id, name, public)
values ('fishhub-photos', 'fishhub-photos', true)
on conflict (id) do nothing;

-- Simple development policies.
-- For launch with login/users, replace these with user_id based policies.
alter table trips enable row level security;
alter table catches enable row level security;
alter table crab_pots enable row level security;
alter table smart_spots enable row level security;
alter table instruction_videos enable row level security;
alter table processing_inventory enable row level security;

drop policy if exists "public dev read trips" on trips;
drop policy if exists "public dev insert trips" on trips;
drop policy if exists "public dev update trips" on trips;
drop policy if exists "public dev delete trips" on trips;
create policy "public dev read trips" on trips for select using (true);
create policy "public dev insert trips" on trips for insert with check (true);
create policy "public dev update trips" on trips for update using (true) with check (true);
create policy "public dev delete trips" on trips for delete using (true);

drop policy if exists "public dev read catches" on catches;
drop policy if exists "public dev insert catches" on catches;
drop policy if exists "public dev update catches" on catches;
drop policy if exists "public dev delete catches" on catches;
create policy "public dev read catches" on catches for select using (true);
create policy "public dev insert catches" on catches for insert with check (true);
create policy "public dev update catches" on catches for update using (true) with check (true);
create policy "public dev delete catches" on catches for delete using (true);

drop policy if exists "public dev read crab" on crab_pots;
drop policy if exists "public dev insert crab" on crab_pots;
drop policy if exists "public dev update crab" on crab_pots;
drop policy if exists "public dev delete crab" on crab_pots;
create policy "public dev read crab" on crab_pots for select using (true);
create policy "public dev insert crab" on crab_pots for insert with check (true);
create policy "public dev update crab" on crab_pots for update using (true) with check (true);
create policy "public dev delete crab" on crab_pots for delete using (true);

drop policy if exists "public dev read spots" on smart_spots;
drop policy if exists "public dev insert spots" on smart_spots;
drop policy if exists "public dev update spots" on smart_spots;
drop policy if exists "public dev delete spots" on smart_spots;
create policy "public dev read spots" on smart_spots for select using (true);
create policy "public dev insert spots" on smart_spots for insert with check (true);
create policy "public dev update spots" on smart_spots for update using (true) with check (true);
create policy "public dev delete spots" on smart_spots for delete using (true);

-- Public upload/read for development. Tighten later after auth is added.
drop policy if exists "public read fishhub photos" on storage.objects;
drop policy if exists "public upload fishhub photos" on storage.objects;
create policy "public read fishhub photos" on storage.objects for select using (bucket_id = 'fishhub-photos');
create policy "public upload fishhub photos" on storage.objects for insert with check (bucket_id = 'fishhub-photos');

insert into smart_spots (name, species, depth_ft, best_tide_window, best_bait, confidence_score, productivity_notes, privacy_level)
values
('Anchor Point Drift', 'halibut', 185, '1 hr before low to 2 hrs after low', 'Herring / salmon belly', 87, 'Demo smart spot. Replace with your real fishing marks.', 'private'),
('West Pot Line', 'crab', 165, 'Tide optional; prioritize soak time', 'Salmon carcass', 91, 'Demo crab line. Best results with 14–20 hour soak.', 'private')
on conflict do nothing;
