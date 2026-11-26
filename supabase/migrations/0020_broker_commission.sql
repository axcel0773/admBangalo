-- 0020: comissão do corretor (no máximo uma por reserva).
--
-- Pedido do dono: ao fechar a reserva, registrar o corretor que trouxe o hóspede, o valor da
-- comissão e se ela já foi paga. A comissão paga entra nas despesas do mês em que foi paga
-- (o Financeiro soma commission_amount por commission_paid_on) e desconta do lucro.
-- Fica na própria reserva: herda o RLS e a checagem de dono que a reserva já tem.

alter table reservations
  add column broker_name        text check (broker_name is null or length(btrim(broker_name)) between 1 and 80),
  add column commission_amount  numeric(12,2) check (commission_amount is null or commission_amount > 0),
  add column commission_paid_on date,
  add column commission_method  payment_method,
  -- Corretor e valor andam juntos; pagamento só existe com comissão; data e forma andam juntas.
  add constraint reservations_commission_complete check ((broker_name is null) = (commission_amount is null)),
  add constraint reservations_commission_paid check (commission_paid_on is null or commission_amount is not null),
  add constraint reservations_commission_method check ((commission_paid_on is null) = (commission_method is null));

-- Despesas do mês e "a pagar" leem por dono e data de pagamento.
create index reservations_commission_paid_idx on reservations (owner_id, commission_paid_on)
  where commission_amount is not null;

-- create_reservation passa a gravar a comissão (payload.commission opcional; sem ela, nada muda).
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
    coalesce((payload->>'status')::reservation_status, 'confirmed'),
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
end $$;
revoke execute on function create_reservation(jsonb) from public, anon;
grant  execute on function create_reservation(jsonb) to authenticated;
