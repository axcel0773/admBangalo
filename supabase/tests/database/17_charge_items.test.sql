-- Itens quebrados/consumo: lançados na reserva com kind 'item' e somados ao total.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'dono-a@teste.local');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
insert into chalets (id, name, max_guests, base_guests, base_nightly_rate)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Bangalô A', 4, 2, 300);
insert into guests (id, full_name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Maria');
select create_reservation(jsonb_build_object(
  'chalet_id', 'aaaaaaaa-0000-0000-0000-000000000001', 'main_guest_id', 'bbbbbbbb-0000-0000-0000-000000000001',
  'check_in', '2030-01-10', 'check_out', '2030-01-12', 'adults', 2, 'nightly_rate', 300));

select lives_ok($$
  insert into reservation_charges (reservation_id, kind, description, mode, unit_amount, quantity)
  select id, 'item', 'Copo quebrado', 'per_stay', 15, 2 from reservations where check_in = '2030-01-10'
$$, 'aceita item quebrado na reserva');

select is((select grand_total from reservation_financials where check_in = '2030-01-10'), 630.00::numeric,
  'item soma no total (600 + 2 × 15)');

select * from finish();
rollback;
