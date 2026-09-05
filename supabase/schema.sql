-- ============================================================
-- SCHEMA — FSSM Check-in App 2026-2027
-- À coller dans Supabase SQL Editor (une seule fois).
-- ============================================================

-- ----------------------------------------
-- 1. TABLES
-- ----------------------------------------

create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  cne        text unique not null,
  nom        text not null,
  prenom     text not null,
  filiere    text,
  active     boolean default true,
  created_at timestamptz default now()
);

create table if not exists checkins (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid references members(id) on delete cascade,
  day        int not null check (day between 1 and 7),
  checked_at timestamptz default now(),
  method     text check (method in ('qr', 'manual')),
  unique (member_id, day)
);

create table if not exists meals (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid references members(id) on delete cascade,
  day            int not null check (day between 1 and 7),
  breakfast      boolean default false,
  breakfast_at   timestamptz,
  lunch          boolean default false,
  lunch_at       timestamptz,
  unique (member_id, day)
);

create table if not exists qr_tokens (
  id         uuid primary key default gen_random_uuid(),
  token      text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- ----------------------------------------
-- 2. INDEX
-- ----------------------------------------

create index if not exists idx_checkins_day        on checkins(day);
create index if not exists idx_checkins_member_day  on checkins(member_id, day);
create index if not exists idx_meals_day            on meals(day);
create index if not exists idx_meals_member_day     on meals(member_id, day);
create index if not exists idx_members_cne          on members(cne);
create index if not exists idx_qr_tokens_expires    on qr_tokens(expires_at);

-- ----------------------------------------
-- 3. HELPER : rôle de l'utilisateur connecté
-- ----------------------------------------

create or replace function get_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    (select raw_user_meta_data ->> 'role' from auth.users where id = auth.uid())
  );
$$;

-- ----------------------------------------
-- 4. ROW LEVEL SECURITY
-- Les écritures publiques (scan, génération QR) passent par les
-- routes API Next.js avec la clé service_role (RLS ignorée).
-- Ici on ne définit que les accès des 3 comptes authentifiés.
-- ----------------------------------------

alter table members   enable row level security;
alter table checkins  enable row level security;
alter table meals     enable row level security;
alter table qr_tokens enable row level security;

-- members
drop policy if exists "members_admin_all"  on members;
drop policy if exists "members_staff_read" on members;
create policy "members_admin_all" on members
  for all to authenticated
  using (get_user_role() = 'admin')
  with check (get_user_role() = 'admin');
create policy "members_staff_read" on members
  for select to authenticated
  using (get_user_role() in ('checkin', 'restauration'));

-- checkins
drop policy if exists "checkins_admin_all"     on checkins;
drop policy if exists "checkins_checkin_read"  on checkins;
drop policy if exists "checkins_checkin_write" on checkins;
drop policy if exists "checkins_resto_read"    on checkins;
create policy "checkins_admin_all" on checkins
  for all to authenticated
  using (get_user_role() = 'admin')
  with check (get_user_role() = 'admin');
create policy "checkins_checkin_read" on checkins
  for select to authenticated
  using (get_user_role() = 'checkin');
create policy "checkins_checkin_write" on checkins
  for insert to authenticated
  with check (get_user_role() = 'checkin');
create policy "checkins_resto_read" on checkins
  for select to authenticated
  using (get_user_role() = 'restauration');

-- meals
drop policy if exists "meals_admin_all"    on meals;
drop policy if exists "meals_resto_read"   on meals;
drop policy if exists "meals_resto_insert" on meals;
drop policy if exists "meals_resto_update" on meals;
create policy "meals_admin_all" on meals
  for all to authenticated
  using (get_user_role() = 'admin')
  with check (get_user_role() = 'admin');
create policy "meals_resto_read" on meals
  for select to authenticated
  using (get_user_role() = 'restauration');
create policy "meals_resto_insert" on meals
  for insert to authenticated
  with check (get_user_role() = 'restauration');
create policy "meals_resto_update" on meals
  for update to authenticated
  using (get_user_role() = 'restauration')
  with check (get_user_role() = 'restauration');

-- qr_tokens
drop policy if exists "qr_admin_all"    on qr_tokens;
drop policy if exists "qr_checkin_read" on qr_tokens;
create policy "qr_admin_all" on qr_tokens
  for all to authenticated
  using (get_user_role() = 'admin')
  with check (get_user_role() = 'admin');
create policy "qr_checkin_read" on qr_tokens
  for select to authenticated
  using (get_user_role() = 'checkin');

-- ----------------------------------------
-- 5. VUES STATISTIQUES
-- ----------------------------------------

create or replace view v_stats_by_day as
select
  d.day,
  count(distinct c.member_id)                                    as presents,
  count(distinct case when m.breakfast then m.member_id end)     as breakfasts,
  count(distinct case when m.lunch     then m.member_id end)     as lunches
from generate_series(1, 7) as d(day)
left join checkins c on c.day = d.day
left join meals    m on m.member_id = c.member_id and m.day = d.day
group by d.day
order by d.day;

-- ----------------------------------------
-- 6. REALTIME
-- ----------------------------------------

alter publication supabase_realtime add table checkins;
alter publication supabase_realtime add table meals;
