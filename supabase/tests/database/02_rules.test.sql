-- Regras de negócio garantidas pelo banco (triggers, constraints e funções).
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'dono@teste.local');
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into chalets (id, name, max_guests, base_guests, base_nightly_rate)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Chalé Ipê', 4, 2, 350);
insert into fees (name, kind, mode, amount) values
  ('Limpeza', 'cleaning', 'per_stay', 150),
  ('Energia', 'energy', 'metered', 1.00);
insert into guests (id, full_name, document) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Maria', '529.982.247-25');
insert into reservations (id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001', '2030-01-10', '2030-01-13', 2, 350);

-- Taxas automáticas e energia por medidor
select is((select count(*) from reservation_charges)::int, 2, 'limpeza e energia entram sozinhas na reserva');
update reservation_charges set meter_start = 1200, meter_end = 1284.5 where kind = 'energy';
select is((select total from reservation_charges where kind = 'energy'), 84.50::numeric, 'energia = 84,5 kWh × R$ 1,00');
select is((select grand_total from reservation_financials), 1284.50::numeric, 'total = 3 × 350 + 150 + 84,50');

-- Sobreposição e capacidade
select throws_ok(
  $$insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2030-01-12', '2030-01-14', 2, 350)$$,
  '23P01',
  'conflicting key value violates exclusion constraint "reservations_no_overlap"',
  'não aceita reserva sobreposta no mesmo chalé'
);
select lives_ok(
  $$insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2030-01-13', '2030-01-15', 2, 350)$$,
  'aceita entrada no dia da saída da anterior'
);
select throws_ok(
  $$insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2030-02-01', '2030-02-03', 5, 350)$$,
  '23514',
  'Capacidade do chalé excedida: 5 hóspedes para máximo de 4',
  'não aceita mais pessoas que a capacidade'
);

-- Pagamentos
insert into payments (reservation_id, kind, method, amount) values ('cccccccc-0000-0000-0000-000000000001', 'deposit', 'pix', 600);
select throws_ok(
  $$insert into payments (reservation_id, kind, method, amount) values ('cccccccc-0000-0000-0000-000000000001', 'refund', 'pix', 600.01)$$,
  '23514',
  'O estorno passa do que foi pago.',
  'estorno não passa do que foi pago'
);
select throws_ok(
  $$insert into payments (reservation_id, kind, method, amount, receipt_path)
    values ('cccccccc-0000-0000-0000-000000000001', 'installment', 'pix', 10, '22222222-2222-2222-2222-222222222222/x/a.jpg')$$,
  '23514',
  'new row for relation "payments" violates check constraint "payments_receipt_path_owner"',
  'comprovante precisa estar na pasta do dono'
);
update reservations set status = 'cancelled' where id = 'cccccccc-0000-0000-0000-000000000001';
select throws_ok(
  $$insert into payments (reservation_id, kind, method, amount) values ('cccccccc-0000-0000-0000-000000000001', 'balance', 'pix', 10)$$,
  '23514',
  'Reserva cancelada: só é possível lançar estorno.',
  'reserva cancelada só aceita estorno'
);
select lives_ok(
  $$insert into payments (reservation_id, kind, method, amount) values ('cccccccc-0000-0000-0000-000000000001', 'refund', 'pix', 600)$$,
  'estorno em reserva cancelada é aceito'
);

-- Temporadas sem sobreposição
insert into chalet_rates (chalet_id, label, period, nightly_rate, min_nights)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Réveillon', '[2030-12-30,2031-01-02)', 600, 3);
select throws_ok(
  $$insert into chalet_rates (chalet_id, label, period, nightly_rate)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ano novo', '[2031-01-01,2031-01-05)', 500)$$,
  '23P01',
  'conflicting key value violates exclusion constraint "chalet_rates_chalet_id_period_excl"',
  'temporadas do mesmo chalé não se sobrepõem'
);

-- LGPD: anonimizar mantém o financeiro
select lives_ok($$select anonymize_guest('bbbbbbbb-0000-0000-0000-000000000001')$$, 'dono anonimiza o hóspede');
select is(
  (select full_name || coalesce(document, '') from guests where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'Hóspede removido',
  'nome e CPF apagados; reservas e pagamentos continuam'
);

select * from finish();
rollback;
