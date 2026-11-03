-- =====================================================================
-- Gestão de Chalés — schema inicial (Supabase / PostgreSQL 15+)
-- Decisões padrão:
--   * Vários chalés por proprietário; cada linha tem owner_id e RLS isola
--     os dados por proprietário (permite virar multi-proprietário depois).
--   * Taxas configuráveis por chalé: fixa por estadia, por diária, por
--     pessoa, por pessoa/diária ou medida (kWh × tarifa).
--   * Pagamentos lançados manualmente (Pix, dinheiro, cartão...).
-- =====================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type reservation_status as enum
  ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');

create type reservation_source as enum
  ('direct', 'whatsapp', 'airbnb', 'booking', 'other');

create type fee_kind as enum ('energy', 'cleaning', 'extra_guest', 'pet', 'other');

create type charge_mode as enum
  ('per_stay',        -- valor fixo por estadia (ex.: limpeza R$ 150)
   'per_night',       -- valor × diárias (ex.: energia R$ 20/dia)
   'per_guest',       -- valor × hóspedes
   'per_guest_night', -- valor × hóspedes × diárias
   'metered');        -- leitura do medidor (kWh) × tarifa

create type payment_method as enum
  ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'platform', 'other');

create type payment_kind as enum ('deposit', 'installment', 'balance', 'refund');

-- ---------------------------------------------------------------------
-- Utilitário: updated_at automático
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Perfil do proprietário (1:1 com auth.users)
-- ---------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  business_name text,
  pix_key     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- Chalés
-- ---------------------------------------------------------------------
create table chalets (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name              text not null,
  description       text,
  max_guests        int  not null check (max_guests > 0),
  base_guests       int  not null default 2 check (base_guests > 0),  -- incluídos na diária
  base_nightly_rate numeric(10,2) not null check (base_nightly_rate >= 0),
  check_in_time     time not null default '14:00',
  check_out_time    time not null default '12:00',
  color             text not null default '#2f6f4f',                  -- cor no calendário
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (base_guests <= max_guests)
);
create index on chalets (owner_id);

-- Tabela de preços sazonais (feriados, alta temporada). Opcional.
create table chalet_rates (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chalet_id    uuid not null references chalets(id) on delete cascade,
  label        text not null,                    -- "Réveillon", "Julho"
  period       daterange not null,
  nightly_rate numeric(10,2) not null check (nightly_rate >= 0),
  min_nights   int not null default 1 check (min_nights > 0),
  exclude using gist (chalet_id with =, period with &&)
);

-- ---------------------------------------------------------------------
-- Taxas configuráveis (energia, limpeza, pessoa extra, pet...)
-- chalet_id nulo = taxa padrão para todos os chalés do proprietário
-- ---------------------------------------------------------------------
create table fees (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chalet_id     uuid references chalets(id) on delete cascade,
  name          text not null,                  -- "Limpeza", "Energia elétrica"
  kind          fee_kind not null,
  mode          charge_mode not null,
  amount        numeric(10,2) not null check (amount >= 0),  -- valor unitário / tarifa por kWh
  auto_apply    boolean not null default true,  -- incluir automaticamente em novas reservas
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on fees (owner_id, chalet_id);

-- ---------------------------------------------------------------------
-- Hóspedes (cadastro reutilizável entre reservas)
-- ---------------------------------------------------------------------
create table guests (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name   text not null,
  document    text,                 -- CPF / RG / passaporte
  birth_date  date,
  phone       text,
  email       text,
  city        text,
  state       text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on guests (owner_id);
create index guests_name_search on guests using gin (to_tsvector('simple', full_name));
create unique index guests_owner_document_uq on guests (owner_id, document) where document is not null;

-- ---------------------------------------------------------------------
-- Reservas
-- ---------------------------------------------------------------------
create table reservations (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chalet_id       uuid not null references chalets(id) on delete restrict,
  main_guest_id   uuid not null references guests(id) on delete restrict,
  check_in        date not null,
  check_out       date not null,
  nights          int generated always as (check_out - check_in) stored,
  adults          int not null default 1 check (adults >= 1),
  children        int not null default 0 check (children >= 0),
  nightly_rate    numeric(10,2) not null check (nightly_rate >= 0),
  discount        numeric(10,2) not null default 0 check (discount >= 0),
  lodging_total   numeric(12,2) generated always as
                    ((check_out - check_in) * nightly_rate - discount) stored,
  status          reservation_status not null default 'confirmed',
  source          reservation_source not null default 'direct',
  notes           text,
  checked_in_at   timestamptz,
  checked_out_at  timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (check_out > check_in),
  -- impede reservas sobrepostas no mesmo chalé (canceladas não contam)
  constraint reservations_no_overlap exclude using gist (
    chalet_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status <> 'cancelled')
);
create index on reservations (owner_id, check_in);
create index on reservations (chalet_id, check_in);
create index on reservations (main_guest_id);

-- Valida capacidade do chalé
create or replace function check_reservation_capacity() returns trigger
language plpgsql as $$
declare cap int;
begin
  select max_guests into cap from chalets where id = new.chalet_id;
  if new.adults + new.children > cap then
    raise exception 'Capacidade do chalé excedida: % hóspedes para máximo de %',
      new.adults + new.children, cap using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger reservations_capacity
  before insert or update of chalet_id, adults, children on reservations
  for each row execute function check_reservation_capacity();

-- ---------------------------------------------------------------------
-- Todas as pessoas da reserva (nomes dos hóspedes)
-- ---------------------------------------------------------------------
create table reservation_guests (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reservation_id  uuid not null references reservations(id) on delete cascade,
  guest_id        uuid references guests(id) on delete set null,  -- opcional: vínculo ao cadastro
  full_name       text not null,
  document        text,
  is_child        boolean not null default false,
  is_main         boolean not null default false,
  created_at      timestamptz not null default now()
);
create index on reservation_guests (reservation_id);
create unique index reservation_guests_one_main
  on reservation_guests (reservation_id) where is_main;

-- ---------------------------------------------------------------------
-- Cobranças extras da reserva (energia, limpeza, pessoa extra...)
-- A hospedagem (diárias) fica em reservations.lodging_total.
-- ---------------------------------------------------------------------
create table reservation_charges (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reservation_id  uuid not null references reservations(id) on delete cascade,
  fee_id          uuid references fees(id) on delete set null,
  kind            fee_kind not null,
  description     text not null,
  mode            charge_mode not null,
  unit_amount     numeric(10,2) not null check (unit_amount >= 0),
  quantity        numeric(10,2) not null default 1 check (quantity >= 0),
  meter_start     numeric(10,1),     -- leitura kWh no check-in
  meter_end       numeric(10,1),     -- leitura kWh no check-out
  total           numeric(12,2) generated always as (round(unit_amount * quantity, 2)) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (meter_end is null or meter_start is null or meter_end >= meter_start)
);
create index on reservation_charges (reservation_id);

-- Para cobrança medida, quantidade = consumo (fim - início) quando houver leituras
create or replace function charges_sync_meter() returns trigger
language plpgsql as $$
begin
  if new.mode = 'metered' then
    if new.meter_start is not null and new.meter_end is not null then
      new.quantity := new.meter_end - new.meter_start;
    else
      new.quantity := 0;  -- ainda sem leitura final: não entra no total
    end if;
  end if;
  return new;
end $$;

create trigger reservation_charges_meter
  before insert or update on reservation_charges
  for each row execute function charges_sync_meter();

-- Aplica taxas automáticas ao criar a reserva
create or replace function apply_default_fees() returns trigger
language plpgsql as $$
declare
  f record;
  guests_count int := new.adults + new.children;
  base_guests_count int;
begin
  select base_guests into base_guests_count from chalets where id = new.chalet_id;

  for f in
    select * from fees
    where owner_id = new.owner_id
      and active and auto_apply
      and (chalet_id = new.chalet_id or chalet_id is null)
  loop
    -- taxa de pessoa extra só cobra acima dos hóspedes incluídos
    if f.kind = 'extra_guest' and guests_count <= base_guests_count then
      continue;
    end if;

    insert into reservation_charges
      (owner_id, reservation_id, fee_id, kind, description, mode, unit_amount, quantity)
    values (
      new.owner_id, new.id, f.id, f.kind, f.name, f.mode, f.amount,
      case f.mode
        when 'per_stay'        then 1
        when 'per_night'       then new.nights
        when 'per_guest'       then case when f.kind = 'extra_guest'
                                         then guests_count - base_guests_count
                                         else guests_count end
        when 'per_guest_night' then new.nights * case when f.kind = 'extra_guest'
                                         then guests_count - base_guests_count
                                         else guests_count end
        when 'metered'         then 0
      end
    );
  end loop;
  return new;
end $$;

create trigger reservations_apply_fees
  after insert on reservations
  for each row execute function apply_default_fees();

-- ---------------------------------------------------------------------
-- Pagamentos recebidos (lançamento manual)
-- ---------------------------------------------------------------------
create table payments (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reservation_id  uuid not null references reservations(id) on delete cascade,
  kind            payment_kind not null default 'installment',
  method          payment_method not null default 'pix',
  amount          numeric(12,2) not null check (amount > 0),  -- estorno: kind = 'refund'
  paid_at         date not null default current_date,
  receipt_path    text,            -- comprovante no Supabase Storage
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on payments (reservation_id);
create index on payments (owner_id, paid_at);

-- Parcelas previstas (valores a receber com vencimento)
create table payment_schedule (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reservation_id  uuid not null references reservations(id) on delete cascade,
  description     text not null,          -- "Sinal 50%", "Saldo no check-in"
  amount          numeric(12,2) not null check (amount > 0),
  due_date        date not null,
  created_at      timestamptz not null default now()
);
create index on payment_schedule (owner_id, due_date);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create trigger t_profiles_upd     before update on profiles            for each row execute function set_updated_at();
create trigger t_chalets_upd      before update on chalets             for each row execute function set_updated_at();
create trigger t_fees_upd         before update on fees                for each row execute function set_updated_at();
create trigger t_guests_upd       before update on guests              for each row execute function set_updated_at();
create trigger t_reservations_upd before update on reservations        for each row execute function set_updated_at();
create trigger t_charges_upd      before update on reservation_charges for each row execute function set_updated_at();
create trigger t_payments_upd     before update on payments            for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Views financeiras (security_invoker => respeitam o RLS do usuário)
-- ---------------------------------------------------------------------
create view reservation_financials with (security_invoker = true) as
select
  r.id                as reservation_id,
  r.owner_id,
  r.chalet_id,
  c.name              as chalet_name,
  r.main_guest_id,
  g.full_name         as main_guest_name,
  r.check_in,
  r.check_out,
  r.nights,
  r.adults + r.children as guests_count,
  r.status,
  r.lodging_total,
  coalesce(ch.total, 0)                         as charges_total,
  coalesce(ch.energy, 0)                        as energy_total,
  coalesce(ch.cleaning, 0)                      as cleaning_total,
  r.lodging_total + coalesce(ch.total, 0)       as grand_total,
  coalesce(p.paid, 0)                           as paid_total,
  r.lodging_total + coalesce(ch.total, 0) - coalesce(p.paid, 0) as balance_due,
  case
    when r.status = 'cancelled'                                          then 'cancelled'
    when coalesce(p.paid, 0) <= 0                                        then 'unpaid'
    when coalesce(p.paid, 0) < r.lodging_total + coalesce(ch.total, 0)   then 'partial'
    else 'paid'
  end                                           as payment_status
from reservations r
join chalets c on c.id = r.chalet_id
join guests  g on g.id = r.main_guest_id
left join lateral (
  select sum(total) as total,
         sum(total) filter (where kind = 'energy')   as energy,
         sum(total) filter (where kind = 'cleaning') as cleaning
  from reservation_charges where reservation_id = r.id
) ch on true
left join lateral (
  select sum(case when kind = 'refund' then -amount else amount end) as paid
  from payments where reservation_id = r.id
) p on true;

-- Resumo mensal: recebido x a receber (por mês de check-in)
create view monthly_summary with (security_invoker = true) as
select
  owner_id,
  date_trunc('month', check_in)::date as month,
  count(*)                          as reservations,
  sum(nights)                       as nights_sold,
  sum(grand_total)                  as revenue_expected,
  sum(paid_total)                   as revenue_received,
  sum(greatest(balance_due, 0))     as revenue_pending,
  sum(energy_total)                 as energy_total,
  sum(cleaning_total)               as cleaning_total
from reservation_financials
where status <> 'cancelled'
group by owner_id, date_trunc('month', check_in);

-- Ocupação diária (para o calendário e taxa de ocupação)
create view occupancy_days with (security_invoker = true) as
select r.owner_id, r.chalet_id, r.id as reservation_id, d::date as day, r.status
from reservations r
cross join lateral generate_series(r.check_in, r.check_out - 1, interval '1 day') d
where r.status <> 'cancelled';

-- ---------------------------------------------------------------------
-- RPC: disponibilidade de um chalé num período
-- ---------------------------------------------------------------------
create or replace function chalet_is_available(
  p_chalet_id uuid, p_check_in date, p_check_out date, p_ignore_reservation uuid default null
) returns boolean
language sql stable security invoker as $$
  select not exists (
    select 1 from reservations
    where chalet_id = p_chalet_id
      and status <> 'cancelled'
      and (p_ignore_reservation is null or id <> p_ignore_reservation)
      and daterange(check_in, check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security: cada proprietário só enxerga os próprios dados
-- ---------------------------------------------------------------------
alter table profiles            enable row level security;
alter table chalets             enable row level security;
alter table chalet_rates        enable row level security;
alter table fees                enable row level security;
alter table guests              enable row level security;
alter table reservations        enable row level security;
alter table reservation_guests  enable row level security;
alter table reservation_charges enable row level security;
alter table payments            enable row level security;
alter table payment_schedule    enable row level security;

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array[
    'chalets','chalet_rates','fees','guests','reservations',
    'reservation_guests','reservation_charges','payments','payment_schedule'
  ] loop
    execute format(
      'create policy "owner access" on %I for all to authenticated
         using (owner_id = (select auth.uid()))
         with check (owner_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Storage: comprovantes de pagamento (bucket privado "receipts")
-- caminho: <owner_id>/<reservation_id>/<arquivo>
-- ---------------------------------------------------------------------
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);
-- create policy "own receipts" on storage.objects for all to authenticated
--   using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text)
--   with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
