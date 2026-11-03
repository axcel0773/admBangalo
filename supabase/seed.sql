-- =====================================================================
-- Dados de exemplo para desenvolvimento (NÃO rode em produção).
-- Usa o primeiro usuário de auth.users como proprietário e cria
-- reservas relativas a hoje, para o Painel mostrar chegadas, saídas
-- e saldos. Rode no SQL Editor do Supabase depois da migração 0001.
-- =====================================================================

do $$
declare
  v_owner uuid;
  v_ipe uuid; v_arau uuid; v_jabu uuid;
  g_maria uuid; g_andrade uuid; g_paulo uuid; g_lucas uuid; g_camila uuid;
  r_maria uuid; r_andrade uuid; r_paulo uuid; r_lucas uuid; r_camila uuid;
  v_total numeric;
begin
  select id into v_owner from auth.users order by created_at limit 1;
  if v_owner is null then
    raise exception 'Crie um usuário em Authentication → Users antes de rodar o seed.';
  end if;

  if exists (select 1 from chalets where owner_id = v_owner) then
    raise notice 'Já existem chalés para este usuário; seed ignorado.';
    return;
  end if;

  update profiles
     set full_name     = coalesce(nullif(full_name, ''), 'Ricardo Alves'),
         business_name = coalesce(business_name, 'Chalés da Serra'),
         pix_key       = coalesce(pix_key, 'pix@exemplo.com')
   where id = v_owner;

  -- Chalés ---------------------------------------------------------------
  insert into chalets (owner_id, name, max_guests, base_guests, base_nightly_rate, color)
  values (v_owner, 'Chalé Ipê', 4, 2, 350, '#4A6B3A') returning id into v_ipe;
  insert into chalets (owner_id, name, max_guests, base_guests, base_nightly_rate, color)
  values (v_owner, 'Chalé Araucária', 6, 4, 480, '#5E7C8C') returning id into v_arau;
  insert into chalets (owner_id, name, max_guests, base_guests, base_nightly_rate, color)
  values (v_owner, 'Chalé Jabuticaba', 2, 2, 290, '#8B5A6B') returning id into v_jabu;

  -- Taxas gerais (valem para todos os chalés) ----------------------------
  insert into fees (owner_id, name, kind, mode, amount) values
    (v_owner, 'Limpeza',          'cleaning',    'per_stay',        150),
    (v_owner, 'Energia elétrica', 'energy',      'metered',         0.95),
    (v_owner, 'Pessoa extra',     'extra_guest', 'per_guest_night', 60);

  -- Hóspedes ---------------------------------------------------------------
  insert into guests (owner_id, full_name, document, phone, city, state)
  values (v_owner, 'Maria Souza', '123.456.789-00', '(11) 98765-4321', 'São Paulo', 'SP')
  returning id into g_maria;
  insert into guests (owner_id, full_name, phone, city, state)
  values (v_owner, 'Família Andrade', '(41) 99123-0045', 'Curitiba', 'PR') returning id into g_andrade;
  insert into guests (owner_id, full_name, phone, city, state)
  values (v_owner, 'Paulo Lima', '(21) 99654-1102', 'Rio de Janeiro', 'RJ') returning id into g_paulo;
  insert into guests (owner_id, full_name, phone, city, state)
  values (v_owner, 'Lucas Melo', '(19) 98811-2290', 'Campinas', 'SP') returning id into g_lucas;
  insert into guests (owner_id, full_name, phone, city, state)
  values (v_owner, 'Camila Rocha', '(11) 97002-7781', 'São Paulo', 'SP') returning id into g_camila;

  -- Reservas (as taxas automáticas entram pelo trigger) -------------------
  -- Saída hoje, já paga (exceto a energia, lançada abaixo).
  insert into reservations (owner_id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate, status, source)
  values (v_owner, v_jabu, g_paulo, current_date - 3, current_date, 2, 290, 'checked_in', 'direct')
  returning id into r_paulo;

  -- Chegada hoje, com sinal pago: saldo vence hoje.
  insert into reservations (owner_id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate, status, source)
  values (v_owner, v_ipe, g_maria, current_date, current_date + 3, 3, 350, 'confirmed', 'whatsapp')
  returning id into r_maria;

  -- Chegada hoje, família com criança.
  insert into reservations (owner_id, chalet_id, main_guest_id, check_in, check_out, adults, children, nightly_rate, status, source)
  values (v_owner, v_arau, g_andrade, current_date, current_date + 3, 3, 1, 480, 'confirmed', 'airbnb')
  returning id into r_andrade;

  -- Futuras.
  insert into reservations (owner_id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate, status, source)
  values (v_owner, v_arau, g_lucas, current_date + 5, current_date + 7, 2, 480, 'confirmed', 'booking')
  returning id into r_lucas;

  insert into reservations (owner_id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate, status, source)
  values (v_owner, v_ipe, g_camila, current_date + 11, current_date + 14, 2, 350, 'pending', 'whatsapp')
  returning id into r_camila;

  -- Pessoas de cada reserva -----------------------------------------------
  insert into reservation_guests (owner_id, reservation_id, guest_id, full_name, document, is_main) values
    (v_owner, r_maria, g_maria, 'Maria Souza', '123.456.789-00', true);
  insert into reservation_guests (owner_id, reservation_id, full_name, document) values
    (v_owner, r_maria, 'João Souza', '987.654.321-00'),
    (v_owner, r_maria, 'Ana Lima', null);
  insert into reservation_guests (owner_id, reservation_id, guest_id, full_name, is_main) values
    (v_owner, r_andrade, g_andrade, 'Carlos Andrade', true);
  insert into reservation_guests (owner_id, reservation_id, full_name, is_child) values
    (v_owner, r_andrade, 'Beatriz Andrade', false),
    (v_owner, r_andrade, 'Rafael Andrade', false),
    (v_owner, r_andrade, 'Lia Andrade', true);

  -- Energia: Paulo já tem leitura; os demais ganham a leitura de entrada.
  update reservation_charges set meter_start = 500, meter_end = 562
   where reservation_id = r_paulo and kind = 'energy';
  update reservation_charges set meter_start = 1000
   where reservation_id = r_maria and kind = 'energy';

  -- Pagamentos ---------------------------------------------------------------
  -- Paulo pagou tudo menos a energia (fica um saldo pequeno a cobrar na saída).
  select lodging_total + 150 into v_total from reservations where id = r_paulo;
  insert into payments (owner_id, reservation_id, kind, method, amount, paid_at)
  values (v_owner, r_paulo, 'deposit', 'cash', v_total, current_date - 3);

  insert into payments (owner_id, reservation_id, kind, method, amount, paid_at)
  values (v_owner, r_maria, 'deposit', 'pix', 600, current_date - 14);

  select round(grand_total / 2, 2) into v_total from reservation_financials where reservation_id = r_andrade;
  insert into payments (owner_id, reservation_id, kind, method, amount, paid_at)
  values (v_owner, r_andrade, 'deposit', 'pix', v_total, current_date - 6);

  select grand_total into v_total from reservation_financials where reservation_id = r_lucas;
  insert into payments (owner_id, reservation_id, kind, method, amount, paid_at)
  values (v_owner, r_lucas, 'balance', 'pix', v_total, current_date - 1);

  insert into payment_schedule (owner_id, reservation_id, description, amount, due_date)
  values (v_owner, r_camila, 'Sinal 50%', 900, current_date + 7);

  raise notice 'Seed criado para o usuário %', v_owner;
end $$;
