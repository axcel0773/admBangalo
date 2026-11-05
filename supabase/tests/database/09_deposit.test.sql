-- Sinal: percentual padrão do perfil (0–100) e valor gravado no orçamento.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select is(
  (select column_default from information_schema.columns where table_name = 'profiles' and column_name = 'default_deposit_percent'),
  '30',
  'sinal padrão de 30%'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%default_deposit_percent%'),
  'percentual do sinal limitado a 0–100'
);
select is(
  (select column_default from information_schema.columns where table_name = 'quotes' and column_name = 'deposit_amount'),
  '0',
  'orçamento sem sinal por padrão'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.quotes'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%deposit_amount%'),
  'sinal do orçamento não pode ser negativo'
);

select * from finish();
rollback;
