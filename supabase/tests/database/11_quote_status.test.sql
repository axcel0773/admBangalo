-- Situação do orçamento: padrão e valores aceitos.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select is(
  (select column_default from information_schema.columns where table_name = 'quotes' and column_name = 'status'),
  '''draft''::text',
  'orçamento novo começa como rascunho'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.quotes'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%accepted%declined%'),
  'situações limitadas'
);

select * from finish();
rollback;
