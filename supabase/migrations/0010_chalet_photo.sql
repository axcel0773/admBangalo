-- 0010: foto de capa do chalé (aparece em "Seus chalés" no Painel).
-- Bucket privado "chalet-photos" (caminho: <owner_id>/<chalet_id>/<arquivo>), até 2 MB.

alter table chalets add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chalet-photos', 'chalet-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chalet-photos: dono lê" on storage.objects;
drop policy if exists "chalet-photos: dono envia" on storage.objects;
drop policy if exists "chalet-photos: dono apaga" on storage.objects;

create policy "chalet-photos: dono lê" on storage.objects
  for select to authenticated
  using (bucket_id = 'chalet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "chalet-photos: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chalet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "chalet-photos: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chalet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
