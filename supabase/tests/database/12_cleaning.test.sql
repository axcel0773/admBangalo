-- Limpeza: RLS por dono, uma linha por reserva e remoção junto com a reserva.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select ok((select relrowsecurity from pg_class where oid = 'public.cleaning_tasks'::regclass), 'RLS ligado em cleaning_tasks');
select is((select count(*)::int from pg_policies where tablename = 'cleaning_tasks'), 1, 'uma política (dono)');
select is((select count(*)::int from information_schema.role_table_grants where table_name = 'cleaning_tasks' and grantee = 'anon'), 0, 'anon sem acesso');
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.cleaning_tasks'::regclass and contype = 'f' and confdeltype = 'c'),
  'apaga junto com a reserva'
);

select * from finish();
rollback;
