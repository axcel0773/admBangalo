-- Foto do chalé: bucket privado, limite de 2 MB e políticas por pasta do dono.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select is((select public from storage.buckets where id = 'chalet-photos'), false, 'bucket chalet-photos é privado');
select is((select file_size_limit from storage.buckets where id = 'chalet-photos'), 2097152::bigint, 'limite de 2 MB');
select is(
  (select count(*)::int from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'chalet-photos:%'),
  3, 'três políticas (ler, enviar, apagar)'
);
select ok(
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'chalets' and column_name = 'photo_path'),
  'chalé guarda o caminho da foto'
);

select * from finish();
rollback;
