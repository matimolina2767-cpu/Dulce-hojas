-- =====================================================================
-- Dulce Hogar — esquema inicial
--   * Hogares y miembros (la pareja)
--   * Presencia (estado visual + en casa / ubicación)
--   * Finanzas compartidas (gastos, presupuestos, liquidaciones, saldos)
-- Ejecutar con `supabase db push` o pegando el archivo en el SQL Editor.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.estado_visual as enum (
  'disponible',
  'ocupado',
  'descansando',
  'durmiendo',
  'fuera',
  'te_extrano'
);

create type public.fuente_presencia as enum ('manual', 'geocerca', 'wifi');

create type public.tipo_reparto as enum (
  'mitad',          -- 50/50
  'solo_pagador',   -- el gasto es sólo de quien pagó (no genera deuda)
  'solo_pareja',    -- el gasto es 100% de la otra persona
  'personalizado'   -- usa payer_share (0..1)
);

-- ---------------------------------------------------------------------
-- Utilidad: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Hogares y miembros
-- ---------------------------------------------------------------------
create table public.households (
  id              uuid primary key default gen_random_uuid(),
  name            text not null default 'Dulce Hogar',
  invite_code     text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  currency        text not null default 'ARS',
  -- Geocerca del hogar (opcional) para detectar "en casa" automáticamente
  home_latitude   double precision,
  home_longitude  double precision,
  home_radius_m   integer not null default 120 check (home_radius_m between 20 and 2000),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger households_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

create table public.household_members (
  household_id  uuid not null references public.households (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  display_name  text not null,
  avatar_color  text not null default '#E8A0BF',
  joined_at     timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Un usuario pertenece a un único hogar; un hogar tiene como máximo 2 miembros.
create unique index household_members_one_household_per_user
  on public.household_members (user_id);

create or replace function public.enforce_couple_size()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.household_members where household_id = new.household_id) >= 2 then
    raise exception 'Este hogar ya tiene dos miembros';
  end if;
  return new;
end;
$$;

create trigger household_members_max_two
  before insert on public.household_members
  for each row execute function public.enforce_couple_size();

-- Helper para RLS (security definer evita recursión en las políticas)
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Presencia
-- ---------------------------------------------------------------------
create table public.presence (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  household_id   uuid not null references public.households (id) on delete cascade,
  at_home        boolean not null default false,
  visual_status  public.estado_visual not null default 'disponible',
  status_note    text check (char_length(status_note) <= 80),
  source         public.fuente_presencia not null default 'manual',
  latitude       double precision,
  longitude      double precision,
  accuracy_m     real,
  last_seen_at   timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index presence_household_idx on public.presence (household_id);

create trigger presence_updated_at
  before update on public.presence
  for each row execute function public.set_updated_at();

-- Historial ligero de llegadas/salidas (para "llegó a casa" y estadísticas)
create table public.presence_events (
  id            bigint generated always as identity primary key,
  household_id  uuid not null references public.households (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  at_home       boolean not null,
  source        public.fuente_presencia not null,
  created_at    timestamptz not null default now()
);

create index presence_events_household_idx on public.presence_events (household_id, created_at desc);

create or replace function public.log_presence_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.at_home is distinct from old.at_home then
    insert into public.presence_events (household_id, user_id, at_home, source)
    values (new.household_id, new.user_id, new.at_home, new.source);
  end if;
  return new;
end;
$$;

create trigger presence_log_change
  after insert or update on public.presence
  for each row execute function public.log_presence_change();

-- ---------------------------------------------------------------------
-- Finanzas compartidas
-- ---------------------------------------------------------------------
create table public.budgets (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  category      text not null default 'general',
  period_month  date not null default date_trunc('month', now())::date
                check (period_month = date_trunc('month', period_month)::date),
  amount        numeric(12, 2) not null check (amount >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (household_id, category, period_month)
);

create trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  paid_by       uuid not null references auth.users (id),
  amount        numeric(12, 2) not null check (amount > 0),
  category      text not null default 'general',
  description   text,
  spent_on      date not null default current_date,
  split_type    public.tipo_reparto not null default 'mitad',
  -- Fracción del gasto que corresponde a quien pagó (0..1).
  payer_share   numeric(4, 3) not null default 0.5 check (payer_share between 0 and 1),
  created_by    uuid not null default auth.uid() references auth.users (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index expenses_household_date_idx on public.expenses (household_id, spent_on desc);

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- Normaliza payer_share según split_type
create or replace function public.normalize_payer_share()
returns trigger
language plpgsql
as $$
begin
  new.payer_share := case new.split_type
    when 'mitad'        then 0.5
    when 'solo_pagador' then 1
    when 'solo_pareja'  then 0
    else new.payer_share
  end;
  return new;
end;
$$;

create trigger expenses_normalize_share
  before insert or update on public.expenses
  for each row execute function public.normalize_payer_share();

-- Liquidaciones: transferencias entre la pareja para saldar deudas
create table public.settlements (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  from_user     uuid not null references auth.users (id),
  to_user       uuid not null references auth.users (id),
  amount        numeric(12, 2) not null check (amount > 0),
  note          text,
  settled_on    date not null default current_date,
  created_at    timestamptz not null default now(),
  check (from_user <> to_user)
);

create index settlements_household_idx on public.settlements (household_id, settled_on desc);

-- ---------------------------------------------------------------------
-- Vistas (security_invoker => respetan RLS de las tablas base)
-- ---------------------------------------------------------------------

-- Saldo neto por miembro. Positivo = la pareja le debe; negativo = debe.
create or replace view public.member_balances
with (security_invoker = true)
as
with credits as (
  -- lo que pagué por la parte de mi pareja
  select household_id, paid_by as user_id, sum(amount * (1 - payer_share)) as amount
  from public.expenses
  group by household_id, paid_by
),
debits as (
  -- lo que mi pareja pagó por mi parte
  select e.household_id, m.user_id, sum(e.amount * (1 - e.payer_share)) as amount
  from public.expenses e
  join public.household_members m
    on m.household_id = e.household_id and m.user_id <> e.paid_by
  group by e.household_id, m.user_id
),
sent as (
  select household_id, from_user as user_id, sum(amount) as amount
  from public.settlements group by household_id, from_user
),
received as (
  select household_id, to_user as user_id, sum(amount) as amount
  from public.settlements group by household_id, to_user
)
select
  m.household_id,
  m.user_id,
  m.display_name,
  round(
      coalesce(c.amount, 0) - coalesce(d.amount, 0)
    + coalesce(s.amount, 0) - coalesce(r.amount, 0)
  , 2) as balance
from public.household_members m
left join credits  c on c.household_id = m.household_id and c.user_id = m.user_id
left join debits   d on d.household_id = m.household_id and d.user_id = m.user_id
left join sent     s on s.household_id = m.household_id and s.user_id = m.user_id
left join received r on r.household_id = m.household_id and r.user_id = m.user_id;

-- Estado del presupuesto por categoría y mes
create or replace view public.budget_status
with (security_invoker = true)
as
select
  b.household_id,
  b.period_month,
  b.category,
  b.amount as budget,
  coalesce(sum(e.amount), 0)::numeric(12, 2) as spent,
  case when b.amount = 0 then null
       else round(coalesce(sum(e.amount), 0) / b.amount, 4)
  end as usage_ratio
from public.budgets b
left join public.expenses e
  on e.household_id = b.household_id
 and date_trunc('month', e.spent_on)::date = b.period_month
 and (b.category = 'general' or e.category = b.category)
group by b.household_id, b.period_month, b.category, b.amount;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.presence          enable row level security;
alter table public.presence_events   enable row level security;
alter table public.budgets           enable row level security;
alter table public.expenses          enable row level security;
alter table public.settlements       enable row level security;

-- households
create policy "miembros ven su hogar" on public.households
  for select using (public.is_household_member(id));
create policy "miembros editan su hogar" on public.households
  for update using (public.is_household_member(id));

-- household_members
create policy "miembros ven a su pareja" on public.household_members
  for select using (public.is_household_member(household_id));
create policy "cada uno edita su perfil" on public.household_members
  for update using (user_id = auth.uid());

-- presence
create policy "miembros ven la presencia" on public.presence
  for select using (public.is_household_member(household_id));
create policy "cada uno crea su presencia" on public.presence
  for insert with check (user_id = auth.uid() and public.is_household_member(household_id));
create policy "cada uno actualiza su presencia" on public.presence
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_household_member(household_id));

-- presence_events (sólo lectura desde el cliente; se escriben por trigger)
create policy "miembros ven el historial" on public.presence_events
  for select using (public.is_household_member(household_id));

-- budgets
create policy "miembros gestionan presupuestos" on public.budgets
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- expenses
create policy "miembros ven gastos" on public.expenses
  for select using (public.is_household_member(household_id));
create policy "miembros cargan gastos" on public.expenses
  for insert with check (
    public.is_household_member(household_id)
    and exists (select 1 from public.household_members m
                where m.household_id = expenses.household_id and m.user_id = expenses.paid_by)
  );
create policy "miembros editan gastos" on public.expenses
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "miembros borran gastos" on public.expenses
  for delete using (public.is_household_member(household_id));

-- settlements
create policy "miembros ven liquidaciones" on public.settlements
  for select using (public.is_household_member(household_id));
create policy "miembros registran liquidaciones" on public.settlements
  for insert with check (
    public.is_household_member(household_id)
    and auth.uid() in (from_user, to_user)
  );
create policy "miembros borran liquidaciones" on public.settlements
  for delete using (public.is_household_member(household_id));

-- ---------------------------------------------------------------------
-- RPCs de onboarding (crear hogar / unirse con código)
-- ---------------------------------------------------------------------
create or replace function public.create_household(p_name text, p_display_name text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.households;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into public.households (name) values (coalesce(nullif(p_name, ''), 'Dulce Hogar'))
  returning * into h;

  insert into public.household_members (household_id, user_id, display_name)
  values (h.id, auth.uid(), p_display_name);

  insert into public.presence (user_id, household_id) values (auth.uid(), h.id);

  return h;
end;
$$;

create or replace function public.join_household(p_invite_code text, p_display_name text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.households;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select * into h from public.households where invite_code = upper(trim(p_invite_code));
  if h.id is null then
    raise exception 'Código de invitación inválido';
  end if;

  insert into public.household_members (household_id, user_id, display_name, avatar_color)
  values (h.id, auth.uid(), p_display_name, '#9AC8EB');

  insert into public.presence (user_id, household_id) values (auth.uid(), h.id)
  on conflict (user_id) do update set household_id = excluded.household_id;

  return h;
end;
$$;

revoke execute on function public.create_household(text, text) from anon;
revoke execute on function public.join_household(text, text)   from anon;

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.presence;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.budgets;
alter publication supabase_realtime add table public.settlements;
