-- Comissão do corretor: gravada na reserva, regras de preenchimento, create_reservation e RLS.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'dono-a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', 'dono-b@teste.local');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
insert into chalets (id, name, max_guests, base_guests, base_nightly_rate)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Bangalô A', 4, 2, 350);
insert into guests (id, full_name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Maria');

-- create_reservation grava corretor e valor (a pagar).
select lives_ok($$ select create_reservation(jsonb_build_object(
  'chalet_id', 'aaaaaaaa-0000-0000-0000-000000000001', 'main_guest_id', 'bbbbbbbb-0000-0000-0000-000000000001',
  'check_in', '2030-01-10', 'check_out', '2030-01-12', 'adults', 2, 'nightly_rate', 600,
  'commission', jsonb_build_object('broker_name', ' Carlos ', 'amount', 120))) $$, 'create_reservation aceita comissão');
select is((select broker_name || ' ' || commission_amount::text from reservations where check_in = '2030-01-10'),
  'Carlos 120.00', 'comissão gravada com o nome sem espaços');
select is((select commission_paid_on from reservations where check_in = '2030-01-10'), null, 'comissão nasce a pagar');

-- Já paga ao fechar.
select lives_ok($$ select create_reservation(jsonb_build_object(
  'chalet_id', 'aaaaaaaa-0000-0000-0000-000000000001', 'main_guest_id', 'bbbbbbbb-0000-0000-0000-000000000001',
  'check_in', '2030-02-10', 'check_out', '2030-02-12', 'adults', 2, 'nightly_rate', 600,
  'commission', jsonb_build_object('broker_name', 'Ana', 'amount', 60, 'paid_on', '2030-01-05', 'method', 'pix'))) $$,
  'create_reservation aceita comissão já paga');

-- Sem comissão, nada muda.
select lives_ok($$ select create_reservation(jsonb_build_object(
  'chalet_id', 'aaaaaaaa-0000-0000-0000-000000000001', 'main_guest_id', 'bbbbbbbb-0000-0000-0000-000000000001',
  'check_in', '2030-03-10', 'check_out', '2030-03-12', 'adults', 2, 'nightly_rate', 600)) $$, 'create_reservation sem comissão');

select throws_ok($$ update reservations set broker_name = 'Sem valor' where check_in = '2030-03-10' $$,
  '23514', null, 'corretor exige valor');
select throws_ok($$ update reservations set commission_paid_on = '2030-01-01' where check_in = '2030-01-10' $$,
  '23514', null, 'data de pagamento exige a forma');
select throws_ok($$ update reservations set commission_amount = 0 where check_in = '2030-01-10' $$,
  '23514', null, 'valor precisa ser maior que zero');

-- Dono B não vê nem altera a comissão de A.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*)::int from reservations where broker_name is not null), 0, 'B não vê comissões de A');
update reservations set commission_amount = 1 where check_in = '2030-01-10';
reset role;
select is((select commission_amount from reservations where check_in = '2030-01-10'), 120.00::numeric,
  'B não altera a comissão de A');

select * from finish();
rollback;
