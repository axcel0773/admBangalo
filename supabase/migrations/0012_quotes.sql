-- 0012: orçamentos (simulação de hospedagem enviada ao hóspede antes da reserva).
-- Guarda uma cópia dos valores (lines/total): mudar a diária ou as taxas depois não altera o que foi enviado.

create table quotes (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chalet_id    uuid not null references chalets(id) on delete cascade,
  guest_name   text not null check (length(btrim(guest_name)) > 0),
  guest_phone  text,
  check_in     date not null,
  check_out    date not null,
  adults       int  not null check (adults >= 1),
  children     int  not null default 0 check (children >= 0),
  nightly_rate numeric(10,2) not null check (nightly_rate >= 0),
  discount     numeric(10,2) not null default 0 check (discount >= 0),
  lines        jsonb not null default '[]'::jsonb,   -- [{ "description": "...", "amount": 0 }]
  total        numeric(10,2) not null check (total >= 0),
  notes        text,
  valid_until  date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (check_out > check_in),
  check (adults + children <= 6)
);
create index on quotes (owner_id, created_at desc);
create index on quotes (chalet_id);

create trigger t_quotes_upd before update on quotes for each row execute function set_updated_at();

alter table quotes enable row level security;
create policy "owner access" on quotes for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
