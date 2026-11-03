-- Testes de RLS: um proprietário nunca vê nem altera dados de outro.
-- Rodar com `supabase test db` (Supabase local) — também roda no CI.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- Dois proprietários (o trigger handle_new_user cria o perfil de cada um).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'dono-a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', 'dono-b@teste.local');

-- Dono A cadastra chalé, hóspede, reserva e pagamento.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into chalets (id, name, max_guests, base_guests, base_nightly_rate)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Chalé A', 4, 2, 350);
insert into guests (id, full_name, document, phone)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'Maria', '529.982.247-25', '(35) 99999-0000');
insert into reservations (id, chalet_id, main_guest_id, check_in, check_out, adults, nightly_rate)
values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001', '2030-01-10', '2030-01-12', 2, 350);
insert into payments (reservation_id, kind, method, amount)
values ('cccccccc-0000-0000-0000-000000000001', 'deposit', 'pix', 100);
insert into payment_schedule (reservation_id, description, amount, due_date)
values ('cccccccc-0000-0000-0000-000000000001', 'Sinal', 350, '2030-01-01');

select is((select count(*) from chalets)::int, 1, 'A vê o próprio chalé');
select is((select count(*) from reservation_financials)::int, 1, 'A vê a própria reserva na view financeira');
select is((select owner_id::text from guests limit 1), '11111111-1111-1111-1111-111111111111', 'owner_id é preenchido pelo auth.uid()');

-- Dono B não enxerga nada de A.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is((select count(*) from chalets)::int, 0, 'B não vê chalés de A');
select is((select count(*) from guests)::int, 0, 'B não vê hóspedes (CPF, telefone) de A');
select is((select count(*) from reservations)::int, 0, 'B não vê reservas de A');
select is((select count(*) from payments)::int, 0, 'B não vê pagamentos de A');
select is((select count(*) from payment_schedule)::int, 0, 'B não vê parcelas de A');
select is((select count(*) from monthly_summary)::int, 0, 'B não vê o resumo financeiro de A');

-- B não consegue alterar nem gravar em nome de A.
update chalets set name = 'invadido' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select throws_ok(
  $$insert into chalets (owner_id, name, max_guests, base_guests, base_nightly_rate)
    values ('11111111-1111-1111-1111-111111111111', 'falso', 2, 2, 100)$$,
  '42501',
  'new row violates row-level security policy for table "chalets"',
  'B não grava linha com owner_id de A'
);

-- Visitante sem login (anon) não lê nada.
reset role;
set local role anon;
select throws_ok(
  $$select count(*) from guests$$,
  '42501',
  'permission denied for table guests',
  'anon não tem acesso à tabela de hóspedes'
);

reset role;
select is((select name from chalets where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Chalé A', 'update de B não teve efeito');

select * from finish();
rollback;
