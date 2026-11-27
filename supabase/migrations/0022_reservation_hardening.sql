-- 0022_reservation_hardening.sql
-- Security hardening for reservations (pentest findings 1 and 2).

-- FIX 1: desconto sem teto gera total negativo.
-- lodging_total é coluna GERADA; a constraint usa só colunas-base.
alter table public.reservations
  add constraint reservations_discount_le_subtotal
  check (discount <= coalesce(package_total, (check_out - check_in) * nightly_rate));

-- FIX 2: status da reserva definível pelo cliente.
-- create_reservation idêntica à atual, exceto a linha do status, que passa
-- a ser fixada em 'confirmed' (source permanece direct/airbnb como legítimo).
CREATE OR REPLACE FUNCTION public.create_reservation(payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    nightly_rate, discount, package_name, package_total, status, source, notes,
    broker_name, commission_amount, commission_paid_on, commission_method
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
    'confirmed'::reservation_status,
    coalesce((payload->>'source')::reservation_source, 'direct'),
    nullif(trim(payload->>'notes'), ''),
    nullif(trim(payload#>>'{commission,broker_name}'), ''),
    (payload#>>'{commission,amount}')::numeric,
    (payload#>>'{commission,paid_on}')::date,
    (payload#>>'{commission,method}')::payment_method
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
end $function$;
