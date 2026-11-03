-- =====================================================================
-- 0006 — Disponibilidade (parte 6)
-- Bloqueios de datas, calendários externos (Airbnb/Booking) e link iCal.
-- Aplicar depois da 0005.
-- =====================================================================

-- Security Advisor: extensões fora do schema public.
create schema if not exists extensions;
alter extension btree_gist set schema extensions;

-- ---------------------------------------------------------------------
-- Calendários externos que o dono quer importar (link .ics do Airbnb, Booking…)
-- ---------------------------------------------------------------------
create table chalet_ical_sources (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chalet_id       uuid not null references chalets(id) on delete cascade,
  label           text not null,
  url             text not null check (url ~ '^https://'),
  last_synced_at  timestamptz,
  last_error      text,
  created_at      timestamptz not null default now(),
  unique (chalet_id, url)
);
create index on chalet_ical_sources (owner_id);

-- ---------------------------------------------------------------------
-- Datas bloqueadas: manutenção/uso próprio (manual) ou vindas de outro calendário (ical).
-- ends_on é o dia da saída (exclusivo), como check_out.
-- ---------------------------------------------------------------------
create type block_source as enum ('manual', 'ical');

create table chalet_blocks (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chalet_id       uuid not null references chalets(id) on delete cascade,
  starts_on       date not null,
  ends_on         date not null,
  reason          text not null,
  source          block_source not null default 'manual',
  ical_source_id  uuid references chalet_ical_sources(id) on delete cascade,
  external_uid    text,
  created_at      timestamptz not null default now(),
  check (ends_on > starts_on),
  check ((source = 'ical') = (ical_source_id is not null))
);
create index on chalet_blocks (chalet_id, starts_on);
create index on chalet_blocks (owner_id);

alter table chalet_ical_sources enable row level security;
alter table chalet_blocks       enable row level security;

create policy "owner access" on chalet_ical_sources for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner access" on chalet_blocks for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

grant select, insert, update, delete on chalet_ical_sources, chalet_blocks to authenticated;
revoke all on chalet_ical_sources, chalet_blocks from anon;

-- Reserva não pode cair num bloqueio manual. Bloqueios importados (Airbnb/Booking)
-- só avisam: o dono pode lançar aqui a reserva que veio de lá.
create or replace function check_reservation_blocks() returns trigger
language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_reason text;
begin
  if new.status = 'cancelled' then
    return new;
  end if;
  select reason into v_reason
    from chalet_blocks b
   where b.chalet_id = new.chalet_id
     and b.source = 'manual'
     and daterange(b.starts_on, b.ends_on, '[)') && daterange(new.check_in, new.check_out, '[)')
   limit 1;
  if v_reason is not null then
    raise exception 'Datas bloqueadas neste chalé: %', v_reason using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger reservations_blocks
  before insert or update of chalet_id, check_in, check_out, status on reservations
  for each row execute function check_reservation_blocks();

-- ---------------------------------------------------------------------
-- Link iCal de cada chalé (para o Airbnb/Booking importarem as nossas reservas).
-- O token na URL é o segredo; trocar o token invalida o link antigo.
-- ---------------------------------------------------------------------
alter table chalets add column if not exists ical_token uuid not null default gen_random_uuid();
create unique index if not exists chalets_ical_token_uq on chalets (ical_token);

-- Só datas ocupadas, sem nome nem dados do hóspede. security definer porque
-- quem chama é o servidor do Airbnb/Booking, sem login; o token limita a um chalé.
create or replace function ical_feed(p_token uuid)
returns table (uid text, starts_on date, ends_on date, summary text, chalet_name text)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.id::text || '@admbangalo', r.check_in, r.check_out, 'Reservado', c.name
    from chalets c
    join reservations r on r.chalet_id = c.id
   where c.ical_token = p_token
     and r.status <> 'cancelled'
     and r.check_out >= current_date - 30
  union all
  select b.id::text || '@admbangalo', b.starts_on, b.ends_on, 'Bloqueado', c.name
    from chalets c
    join chalet_blocks b on b.chalet_id = c.id
   where c.ical_token = p_token
     and b.source = 'manual'
     and b.ends_on >= current_date - 30
$$;

revoke execute on function ical_feed(uuid) from public;
grant  execute on function ical_feed(uuid) to anon, authenticated;
revoke execute on function check_reservation_blocks() from public, anon, authenticated;
