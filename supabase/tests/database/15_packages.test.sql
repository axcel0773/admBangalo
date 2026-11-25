-- Pacotes: valor fechado da hospedagem, cópia na reserva e no orçamento, RLS por dono.
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
insert into stay_packages (name, nights, total) values ('Fim de semana', 3, 1000);

-- Pacote de 3 noites a R$ 1.000: a hospedagem fecha em 1.000,00 (e não 999,99 com diária 333,33).
insert into reservations (id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate, package_name, package_total)
values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001', '2030-01-10', '2030-01-13', 2, 333.33, 'Fim de semana', 1000);
select is((select lodging_total from reservations where id = 'cccccccc-0000-0000-0000-000000000001'), 1000.00::numeric,
  'pacote: hospedagem é o valor fechado');

update reservations set discount = 50 where id = 'cccccccc-0000-0000-0000-000000000001';
select is((select lodging_total from reservations where id = 'cccccccc-0000-0000-0000-000000000001'), 950.00::numeric,
  'pacote: desconto sai do valor fechado');

-- Sem pacote, continua noites × diária − desconto.
insert into reservations (id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate, discount)
values ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001', '2030-02-10', '2030-02-12', 2, 350, 20);
select is((select lodging_total from reservations where id = 'cccccccc-0000-0000-0000-000000000002'), 680.00::numeric,
  'diária: noites × diária − desconto');

select throws_ok($$ insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate, package_total)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2030-03-10', '2030-03-12', 2, 1, 500) $$,
  '23514', null, 'valor de pacote exige o nome');

-- create_reservation grava o pacote.
select is(
  (select lodging_total from reservations where id = create_reservation(jsonb_build_object(
    'chalet_id', 'aaaaaaaa-0000-0000-0000-000000000001', 'main_guest_id', 'bbbbbbbb-0000-0000-0000-000000000001',
    'check_in', '2030-04-10', 'check_out', '2030-04-13', 'adults', 2,
    'nightly_rate', 416.67, 'package_name', 'Feriado', 'package_total', 1250))),
  1250.00::numeric,
  'create_reservation com pacote');
select is(
  (select package_name from reservations where id = create_reservation(jsonb_build_object(
    'chalet_id', 'aaaaaaaa-0000-0000-0000-000000000001', 'main_guest_id', 'bbbbbbbb-0000-0000-0000-000000000001',
    'check_in', '2030-05-10', 'check_out', '2030-05-12', 'adults', 2, 'nightly_rate', 350))),
  null,
  'create_reservation sem pacote continua por diária');

select is((select grand_total from reservation_financials where reservation_id = 'cccccccc-0000-0000-0000-000000000001'),
  950.00::numeric, 'views financeiras usam o valor do pacote');

select throws_ok($$ insert into quotes (chalet_id, guest_name, check_in, check_out, adults, nightly_rate, total, valid_until, package_name)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ana', '2030-06-10', '2030-06-12', 2, 500, 1000, '2030-06-01', 'Sem valor') $$,
  '23514', null, 'orçamento: nome de pacote exige o valor');

-- Dono B não vê nem altera os pacotes de A.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*)::int from stay_packages), 0, 'B não vê os pacotes de A');
update stay_packages set total = 1 where name = 'Fim de semana';
reset role;
select is((select total from stay_packages where name = 'Fim de semana'), 1000.00::numeric, 'B não altera os pacotes de A');

select * from finish();
rollback;
