-- =====================================================================
-- 0004 — Comprovantes de pagamento (parte 4b)
-- Aplicar depois da 0003, no SQL Editor do Supabase.
-- Bucket privado "receipts"; caminho: <owner_id>/<reservation_id>/<arquivo>
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Cada proprietário só lê, envia e apaga arquivos da própria pasta.
drop policy if exists "receipts: dono lê" on storage.objects;
drop policy if exists "receipts: dono envia" on storage.objects;
drop policy if exists "receipts: dono apaga" on storage.objects;

create policy "receipts: dono lê" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- O caminho salvo no pagamento precisa estar na pasta do dono.
alter table payments drop constraint if exists payments_receipt_path_owner;
alter table payments add constraint payments_receipt_path_owner
  check (receipt_path is null or receipt_path like owner_id::text || '/%');
