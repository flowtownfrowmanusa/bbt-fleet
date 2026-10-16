-- Run this entire script in Supabase > SQL Editor.
-- This starter intentionally shares one fleet among all authenticated crew accounts.
-- For stricter roles, add a company_id/team membership table before production use.
create extension if not exists pgcrypto;

create table if not exists public.assets (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 asset_type text not null default 'Other equipment',
 year integer,
 make text,
 model text,
 unit_tag text,
 tracking_method text not null default 'both' check (tracking_method in ('both','mileage','hours','date')),
 current_mileage numeric(12,1),
 current_hours numeric(12,1),
 notes text,
 created_at timestamptz not null default now(),
 created_by uuid default auth.uid()
);
create table if not exists public.service_schedules (
 id uuid primary key default gen_random_uuid(),
 asset_id uuid not null references public.assets(id) on delete cascade,
 service_name text not null,
 interval_type text not null check (interval_type in ('mileage','hours','days','oneoff')),
 interval_value numeric(12,1),
 last_mileage numeric(12,1),
 last_hours numeric(12,1),
 last_date date,
 alert_lead numeric(12,1) not null default 50,
 notes text,
 created_at timestamptz not null default now(),
 created_by uuid default auth.uid()
);
create table if not exists public.service_records (
 id uuid primary key default gen_random_uuid(),
 asset_id uuid not null references public.assets(id) on delete cascade,
 service_name text not null,
 service_date date not null default current_date,
 mileage numeric(12,1),
 engine_hours numeric(12,1),
 parts_cost numeric(12,2) not null default 0,
 labor_cost numeric(12,2) not null default 0,
 performed_by text,
 notes text,
 created_at timestamptz not null default now(),
 created_by uuid default auth.uid()
);
create table if not exists public.meter_readings (
 id uuid primary key default gen_random_uuid(),
 asset_id uuid not null references public.assets(id) on delete cascade,
 mileage numeric(12,1),
 engine_hours numeric(12,1),
 notes text,
 recorded_at timestamptz not null default now(),
 recorded_by uuid default auth.uid()
);

alter table public.assets enable row level security;
alter table public.service_schedules enable row level security;
alter table public.service_records enable row level security;
alter table public.meter_readings enable row level security;

-- Any signed-in crew member can read and update the shared fleet.
drop policy if exists "crew can read assets" on public.assets;
create policy "crew can read assets" on public.assets for select to authenticated using (true);
drop policy if exists "crew can add assets" on public.assets;
create policy "crew can add assets" on public.assets for insert to authenticated with check (true);
drop policy if exists "crew can update assets" on public.assets;
create policy "crew can update assets" on public.assets for update to authenticated using (true) with check (true);
drop policy if exists "crew can delete assets" on public.assets;
create policy "crew can delete assets" on public.assets for delete to authenticated using (true);

drop policy if exists "crew can read schedules" on public.service_schedules;
create policy "crew can read schedules" on public.service_schedules for select to authenticated using (true);
drop policy if exists "crew can add schedules" on public.service_schedules;
create policy "crew can add schedules" on public.service_schedules for insert to authenticated with check (true);
drop policy if exists "crew can update schedules" on public.service_schedules;
create policy "crew can update schedules" on public.service_schedules for update to authenticated using (true) with check (true);
drop policy if exists "crew can delete schedules" on public.service_schedules;
create policy "crew can delete schedules" on public.service_schedules for delete to authenticated using (true);

drop policy if exists "crew can read service records" on public.service_records;
create policy "crew can read service records" on public.service_records for select to authenticated using (true);
drop policy if exists "crew can add service records" on public.service_records;
create policy "crew can add service records" on public.service_records for insert to authenticated with check (true);
drop policy if exists "crew can update service records" on public.service_records;
create policy "crew can update service records" on public.service_records for update to authenticated using (true) with check (true);
drop policy if exists "crew can delete service records" on public.service_records;
create policy "crew can delete service records" on public.service_records for delete to authenticated using (true);

drop policy if exists "crew can read readings" on public.meter_readings;
create policy "crew can read readings" on public.meter_readings for select to authenticated using (true);
drop policy if exists "crew can add readings" on public.meter_readings;
create policy "crew can add readings" on public.meter_readings for insert to authenticated with check (true);
drop policy if exists "crew can update readings" on public.meter_readings;
create policy "crew can update readings" on public.meter_readings for update to authenticated using (true) with check (true);
drop policy if exists "crew can delete readings" on public.meter_readings;
create policy "crew can delete readings" on public.meter_readings for delete to authenticated using (true);

grant usage on schema public to authenticated;
grant select,insert,update,delete on public.assets, public.service_schedules, public.service_records, public.meter_readings to authenticated;
