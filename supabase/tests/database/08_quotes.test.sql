-- Orçamentos: RLS por dono e regras básicas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select ok((select relrowsecurity from pg_class where oid = 'public.quotes'::regclass), 'RLS ligado em quotes');
select is((select count(*)::int from pg_policies where tablename = 'quotes'), 1, 'uma política (dono)');
select is((select count(*)::int from information_schema.role_table_grants where table_name = 'quotes' and grantee = 'anon'), 0, 'anon sem acesso');
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.quotes'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%adults + children%6%'),
  'limite de 6 pessoas'
);
select ok(
  exists (select 1 from pg_trigger where tgrelid = 'public.quotes'::regclass and tgname = 't_quotes_upd'),
  'updated_at automático'
);

select * from finish();
rollback;
