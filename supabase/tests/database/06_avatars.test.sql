-- Foto de perfil: bucket privado, limitado a imagens pequenas, com políticas por pasta do dono.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select is((select public from storage.buckets where id = 'avatars'), false, 'bucket avatars é privado');
select is((select file_size_limit from storage.buckets where id = 'avatars'), 1048576::bigint, 'limite de 1 MB');
select is(
  (select count(*)::int from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'avatars:%'),
  3, 'três políticas (ler, enviar, apagar)'
);
select ok(
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_path'),
  'perfil guarda o caminho da foto'
);

select * from finish();
rollback;
