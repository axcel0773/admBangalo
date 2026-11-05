-- Despesas: RLS por dono, valor positivo e categorias válidas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select ok((select relrowsecurity from pg_class where oid = 'public.expenses'::regclass), 'RLS ligado em expenses');
select is((select count(*)::int from pg_policies where tablename = 'expenses'), 1, 'uma política (dono)');
select is((select count(*)::int from information_schema.role_table_grants where table_name = 'expenses' and grantee = 'anon'), 0, 'anon sem acesso');
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.expenses'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%amount > (0)::numeric%'),
  'valor da despesa precisa ser positivo'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.expenses'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%maintenance%'),
  'categorias limitadas'
);
select ok(
  exists (select 1 from pg_trigger where tgrelid = 'public.expenses'::regclass and tgname = 't_expenses_upd'),
  'updated_at automático'
);

select * from finish();
rollback;
