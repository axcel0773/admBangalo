-- Push: RLS por dono, segredo do cron só como hash e funções que exigem o segredo.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select ok((select relrowsecurity from pg_class where oid = 'public.push_subscriptions'::regclass), 'RLS ligado em push_subscriptions');
select is((select count(*)::int from pg_policies where tablename = 'push_subscriptions'), 1, 'uma política (dono)');
select is((select count(*)::int from information_schema.role_table_grants where table_name = 'push_subscriptions' and grantee = 'anon'), 0, 'anon sem acesso à tabela');
select is((select count(*)::int from information_schema.role_table_grants where table_name = 'push_cron_secret' and grantee in ('anon', 'authenticated')), 0, 'segredo do cron fora da API');
select throws_ok($$ select * from push_digest('segredo-errado-0123456789', current_date) $$, '28000', 'não autorizado', 'sem o segredo certo, push_digest recusa');
select throws_ok($$ select push_forget('curto', 'https://x.example/e') $$, '28000', 'não autorizado', 'segredo curto é recusado');

insert into push_cron_secret (secret_hash) values (encode(extensions.digest('segredo-de-teste-0123456789', 'sha256'), 'hex'));
select lives_ok($$ select * from push_digest('segredo-de-teste-0123456789', current_date) $$, 'com o segredo certo, push_digest responde');
select lives_ok($$ select push_forget('segredo-de-teste-0123456789', 'https://x.example/e') $$, 'com o segredo certo, push_forget responde');

select * from finish();
rollback;
