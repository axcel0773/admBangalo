-- 0019: pacotes (valor fechado da hospedagem, sem mostrar a diária ao hóspede).
--
-- Pedido do dono: cobrar "fim de semana = R$ 1.000" sem passar a diária. Com diária quebrada
-- (1.000 ÷ 3 = 333,33) o total virava R$ 999,99. Agora a reserva e o orçamento podem guardar o
-- valor fechado; a diária (nightly_rate) continua gravada só como média informativa.

-- Pacotes salvos pelo dono (atalhos na nova reserva e no orçamento).
create table stay_packages (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 60),
  nights     int  not null check (nights between 1 and 60),
  total      numeric(12,2) not null check (total > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on stay_packages (owner_id, nights, name);

create trigger t_stay_packages_upd before update on stay_packages for each row execute function set_updated_at();

alter table stay_packages enable row level security;
create policy "owner access" on stay_packages for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Reserva: cópia do pacote no momento da reserva (editar o pacote depois não muda a reserva).
alter table reservations
  add column package_name  text check (package_name is null or length(btrim(package_name)) between 1 and 60),
  add column package_total numeric(12,2) check (package_total is null or package_total >= 0),
  add constraint reservations_package_complete check ((package_name is null) = (package_total is null));

-- A hospedagem usa o valor fechado quando houver; as views financeiras leem lodging_total e seguem iguais.
alter table reservations
  alter column lodging_total set expression as
    (coalesce(package_total, (check_out - check_in) * nightly_rate) - discount);

-- Orçamento: as mesmas colunas (o total e as linhas já são uma cópia).
alter table quotes
  add column package_name  text check (package_name is null or length(btrim(package_name)) between 1 and 60),
  add column package_total numeric(12,2) check (package_total is null or package_total >= 0),
  add constraint quotes_package_complete check ((package_name is null) = (package_total is null));

-- create_reservation passa a gravar o pacote (chamadas sem ele continuam valendo: diária).
create or replace function create_reservation(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_main_guest uuid := nullif(payload->>'main_guest_id', '')::uuid;
  v_new_guest  jsonb := payload->'new_guest';
  v_reservation uuid;
  v_companion jsonb;
begin
  -- 1. Hóspede responsável: existente ou cadastrado agora.
  if v_main_guest is null then
    if nullif(trim(v_new_guest->>'full_name'), '') is null then
      raise exception 'Informe o nome do hóspede responsável' using errcode = 'check_violation';
    end if;

    insert into guests (full_name, phone, document)
    values (
      trim(v_new_guest->>'full_name'),
      nullif(trim(v_new_guest->>'phone'), ''),
      nullif(trim(v_new_guest->>'document'), '')
    )
    returning id into v_main_guest;
  end if;

  -- 2. Reserva (triggers aplicam capacidade e taxas automáticas).
  insert into reservations (
    chalet_id, main_guest_id, check_in, check_out, adults, children,
    nightly_rate, discount, package_name, package_total, status, source, notes
  )
  values (
    (payload->>'chalet_id')::uuid,
    v_main_guest,
    (payload->>'check_in')::date,
    (payload->>'check_out')::date,
    coalesce((payload->>'adults')::int, 1),
    coalesce((payload->>'children')::int, 0),
    (payload->>'nightly_rate')::numeric,
    coalesce((payload->>'discount')::numeric, 0),
    nullif(trim(payload->>'package_name'), ''),
    (payload->>'package_total')::numeric,
    coalesce((payload->>'status')::reservation_status, 'confirmed'),
    coalesce((payload->>'source')::reservation_source, 'direct'),
    nullif(trim(payload->>'notes'), '')
  )
  returning id into v_reservation;

  -- 3. Pessoas da estadia: responsável + acompanhantes com nome.
  insert into reservation_guests (reservation_id, guest_id, full_name, document, is_main)
  select v_reservation, g.id, g.full_name, g.document, true
  from guests g
  where g.id = v_main_guest;

  for v_companion in select * from jsonb_array_elements(coalesce(payload->'companions', '[]'::jsonb))
  loop
    if nullif(trim(v_companion->>'full_name'), '') is not null then
      insert into reservation_guests (reservation_id, full_name, document, is_child)
      values (
        v_reservation,
        trim(v_companion->>'full_name'),
        nullif(trim(v_companion->>'document'), ''),
        coalesce((v_companion->>'is_child')::boolean, false)
      );
    end if;
  end loop;

  return v_reservation;
end $$;
revoke execute on function create_reservation(jsonb) from public, anon;
grant  execute on function create_reservation(jsonb) to authenticated;
