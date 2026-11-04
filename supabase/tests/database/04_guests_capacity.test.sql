-- Exclusão de hóspedes e limite de 6 pessoas por bangalô.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values ('44444444-4444-4444-4444-444444444444', 'dono4@teste.local');
set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';

select throws_ok(
  $$insert into chalets (name, max_guests, base_guests, base_nightly_rate) values ('Grande', 7, 7, 300)$$,
  '23514', null, 'bangalô não pode passar de 6 pessoas'
);

insert into chalets (id, name, max_guests, base_guests, base_nightly_rate)
values ('aaaaaaaa-4444-0000-0000-000000000001', 'Bangalô 1', 6, 6, 300);
insert into guests (id, full_name) values
  ('bbbbbbbb-4444-0000-0000-000000000001', 'Sem reserva'),
  ('bbbbbbbb-4444-0000-0000-000000000002', 'Com reserva');
insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, children, nightly_rate)
values ('aaaaaaaa-4444-0000-0000-000000000001', 'bbbbbbbb-4444-0000-0000-000000000002', '2031-01-10', '2031-01-12', 4, 2, 300);

select throws_ok(
  $$insert into reservations (chalet_id, main_guest_id, check_in, check_out, adults, children, nightly_rate)
    values ('aaaaaaaa-4444-0000-0000-000000000001', 'bbbbbbbb-4444-0000-0000-000000000002', '2031-02-10', '2031-02-12', 5, 2, 300)$$,
  null, null, 'reserva não aceita mais de 6 pessoas'
);

select is(remove_guest('bbbbbbbb-4444-0000-0000-000000000001'), 'deleted', 'sem reservas: cadastro apagado');
select is((select count(*) from guests where id = 'bbbbbbbb-4444-0000-0000-000000000001')::int, 0, 'linha removida');

select is(remove_guest('bbbbbbbb-4444-0000-0000-000000000002'), 'archived', 'com reservas: arquivado');
select ok(
  (select deleted_at is not null and full_name = 'Hóspede removido' from guests where id = 'bbbbbbbb-4444-0000-0000-000000000002'),
  'dados pessoais apagados e fora da lista'
);
select is((select count(*) from reservations where main_guest_id = 'bbbbbbbb-4444-0000-0000-000000000002')::int, 1, 'reserva continua no financeiro');
select throws_ok($$select remove_guest('bbbbbbbb-4444-0000-0000-000000000002')$$, 'P0002', null, 'excluir de novo não acha o hóspede');

select * from finish();
rollback;
