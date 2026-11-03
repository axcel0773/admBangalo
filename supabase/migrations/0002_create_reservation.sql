-- =====================================================================
-- 0002 — Criação atômica de reserva
-- Grava (opcionalmente) o hóspede responsável novo, a reserva e as
-- pessoas da estadia numa única transação. Se qualquer passo falhar
-- (sobreposição de datas, capacidade, dados inválidos), nada é salvo.
--
-- security invoker: roda com as permissões de quem chama, então o RLS
-- e o owner_id = auth.uid() continuam valendo.
-- =====================================================================

create or replace function create_reservation(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
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
    nightly_rate, discount, status, source, notes
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

revoke all on function create_reservation(jsonb) from public;
grant execute on function create_reservation(jsonb) to authenticated;
