-- Bloqueios de datas e link iCal (parte 6).
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'dono-a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', 'dono-b@teste.local');
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into chalets (id, name, max_guests, base_guests, base_nightly_rate, ical_token)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Chalé Ipê', 4, 2, 350, 'dddddddd-0000-0000-0000-000000000001');
insert into guests (id, full_name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Maria');
insert into chalet_blocks (chalet_id, starts_on, ends_on, reason)
values ('aaaaaaaa-0000-0000-0000-000000000001', '2030-03-01', '2030-03-05', 'Pintura');
insert into chalet_ical_sources (id, chalet_id, label, url)
values ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Airbnb', 'https://www.airbnb.com/calendar/ical/1.ics');
insert into chalet_blocks (chalet_id, starts_on, ends_on, reason, source, ical_source_id, external_uid)
values ('aaaaaaaa-0000-0000-0000-000000000001', '2030-04-10', '2030-04-12', 'Airbnb', 'ical', 'eeeeeeee-0000-0000-0000-000000000001', 'x@airbnb');

select throws_ok(
  $$insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2030-03-04', '2030-03-06', 2, 350)$$,
  '23514',
  'Datas bloqueadas neste chalé: Pintura',
  'reserva não cai em bloqueio manual'
);
select lives_ok(
  $$insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2030-03-05', '2030-03-07', 2, 350)$$,
  'entrada no dia em que o bloqueio termina é aceita'
);
select lives_ok(
  $$insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate, source)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2030-04-10', '2030-04-12', 2, 350, 'airbnb')$$,
  'bloqueio importado do Airbnb não impede lançar a própria reserva'
);
select throws_ok(
  $$insert into chalet_blocks (chalet_id, starts_on, ends_on, reason, source)
    values ('aaaaaaaa-0000-0000-0000-000000000001', '2030-05-01', '2030-05-02', 'x', 'ical')$$,
  '23514',
  'new row for relation "chalet_blocks" violates check constraint "chalet_blocks_check1"',
  'bloqueio importado precisa da origem'
);

-- Outro dono não vê bloqueios nem calendários externos
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*) from chalet_blocks)::int, 0, 'B não vê bloqueios de A');
select is((select count(*) from chalet_ical_sources)::int, 0, 'B não vê os links externos de A');

-- Link iCal: visitante sem login lê só datas, e só com o token certo
reset role;
set local role anon;
select is(
  (select count(*) from ical_feed('dddddddd-0000-0000-0000-000000000001'))::int,
  3,
  'feed tem 2 reservas + 1 bloqueio manual (o importado não volta)'
);
select is(
  (select count(*) from ical_feed('dddddddd-0000-0000-0000-000000000099'))::int,
  0,
  'token errado não devolve nada'
);
select throws_ok(
  $$select count(*) from chalet_blocks$$,
  '42501',
  'permission denied for table chalet_blocks',
  'anon não lê a tabela de bloqueios'
);

select * from finish();
rollback;
