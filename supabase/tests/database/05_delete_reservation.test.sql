-- Trava de exclusão de reservas: só sem dinheiro registrado.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values ('55555555-5555-5555-5555-555555555555', 'dono5@teste.local');
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

insert into chalets (id, name, max_guests, base_guests, base_nightly_rate)
values ('aaaaaaaa-5555-0000-0000-000000000001', 'Bangalô 1', 6, 6, 300);
insert into guests (id, full_name) values ('bbbbbbbb-5555-0000-0000-000000000001', 'Hóspede');
insert into reservations (id, chalet_id, main_guest_id, check_in, check_out, adults, children, nightly_rate) values
  ('cccccccc-5555-0000-0000-000000000001', 'aaaaaaaa-5555-0000-0000-000000000001', 'bbbbbbbb-5555-0000-0000-000000000001', '2031-03-01', '2031-03-03', 2, 0, 300),
  ('cccccccc-5555-0000-0000-000000000002', 'aaaaaaaa-5555-0000-0000-000000000001', 'bbbbbbbb-5555-0000-0000-000000000001', '2031-04-01', '2031-04-03', 2, 0, 300);

-- sem pagamentos: exclui
select lives_ok($$delete from reservations where id = 'cccccccc-5555-0000-0000-000000000001'$$, 'sem pagamentos: exclui');
select is((select count(*) from reservations where id = 'cccccccc-5555-0000-0000-000000000001')::int, 0, 'reserva removida');

-- com pagamento: barra
insert into payments (reservation_id, kind, method, amount) values ('cccccccc-5555-0000-0000-000000000002', 'deposit', 'pix', 100);
select throws_ok(
  $$delete from reservations where id = 'cccccccc-5555-0000-0000-000000000002'$$,
  '23514', 'Esta reserva tem pagamentos lançados. Estorne todo o valor pago antes de excluir.',
  'com pagamento: bloqueia'
);

-- estorno parcial ainda deixa saldo: barra
insert into payments (reservation_id, kind, method, amount) values ('cccccccc-5555-0000-0000-000000000002', 'refund', 'pix', 40);
select throws_ok($$delete from reservations where id = 'cccccccc-5555-0000-0000-000000000002'$$, '23514', null, 'estorno parcial: bloqueia');
select is((select count(*) from reservations where id = 'cccccccc-5555-0000-0000-000000000002')::int, 1, 'reserva continua');

-- estorno total: libera (pagamentos e estornos somem junto, saldo zero)
insert into payments (reservation_id, kind, method, amount) values ('cccccccc-5555-0000-0000-000000000002', 'refund', 'pix', 60);
select lives_ok($$delete from reservations where id = 'cccccccc-5555-0000-0000-000000000002'$$, 'estorno total: exclui');
select is((select count(*) from payments where reservation_id = 'cccccccc-5555-0000-0000-000000000002')::int, 0, 'lançamentos saem junto');

select * from finish();
rollback;
