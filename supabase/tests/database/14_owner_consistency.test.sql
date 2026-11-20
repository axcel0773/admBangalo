-- Um dono não consegue apontar para bangalô, hóspede ou reserva de outro dono.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'dono-a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', 'dono-b@teste.local');

-- Dono A: bangalô, hóspede e reserva.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
insert into chalets (id, name, max_guests, base_guests, base_nightly_rate)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Bangalô A', 4, 2, 350);
insert into guests (id, full_name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Maria');
insert into reservations (id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001', '2030-01-10', '2030-01-12', 2, 350);

select lives_ok($$ insert into chalet_blocks (chalet_id, starts_on, ends_on, reason)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '2030-02-01', '2030-02-03', 'Obra') $$,
  'A bloqueia o próprio bangalô');

-- Dono B tenta usar os ids de A.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
insert into guests (id, full_name) values ('bbbbbbbb-0000-0000-0000-000000000002', 'João');

select throws_ok($$ insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', '2030-03-10', '2030-03-12', 2, 1) $$,
  '23503', null, 'B não reserva o bangalô de A (não trava datas dele)');
select throws_ok($$ insert into chalet_blocks (chalet_id, starts_on, ends_on, reason)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '2030-04-01', '2030-04-03', 'x') $$,
  '23503', null, 'B não bloqueia o bangalô de A (não entra no iCal dele)');
select throws_ok($$ insert into chalet_ical_sources (chalet_id, label, url)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'https://exemplo.com/a.ics') $$,
  '23503', null, 'B não liga calendário externo no bangalô de A');
select throws_ok($$ insert into chalet_rates (chalet_id, label, period, nightly_rate)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', daterange('2031-01-01', '2031-02-01'), 1) $$,
  '23503', null, 'B não cria temporada no bangalô de A');
select throws_ok($$ insert into expenses (chalet_id, category, amount, spent_on)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'other', 1, '2030-01-01') $$,
  '23503', null, 'B não lança despesa no bangalô de A');
select throws_ok($$ insert into payments (reservation_id, kind, method, amount)
  values ('cccccccc-0000-0000-0000-000000000001', 'deposit', 'pix', 1) $$,
  '23503', null, 'B não lança pagamento na reserva de A');
select throws_ok($$ insert into cleaning_tasks (reservation_id) values ('cccccccc-0000-0000-0000-000000000001') $$,
  '23503', null, 'B não marca limpeza da reserva de A');
select throws_ok($$ insert into reservation_guests (reservation_id, full_name)
  values ('cccccccc-0000-0000-0000-000000000001', 'x') $$,
  '23503', null, 'B não inclui pessoa na reserva de A');

reset role;
select is((select count(*)::int from push_subscriptions), 0, 'sem inscrições de push no teste');
select throws_ok($$ insert into push_subscriptions (owner_id, endpoint, p256dh, auth)
  values ('11111111-1111-1111-1111-111111111111', 'https://169.254.169.254/latest', 'x', 'y') $$,
  '23514', null, 'push só para serviços conhecidos');

select * from finish();
rollback;
