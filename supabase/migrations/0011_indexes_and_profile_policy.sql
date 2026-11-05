-- 0011: índices nas chaves estrangeiras (alerta do Supabase) e política de perfil sem reavaliar auth.uid() por linha.

create index if not exists chalet_blocks_ical_source_id_idx on chalet_blocks (ical_source_id);
create index if not exists chalet_rates_owner_id_idx on chalet_rates (owner_id);
create index if not exists fees_chalet_id_idx on fees (chalet_id);
create index if not exists payment_schedule_reservation_id_idx on payment_schedule (reservation_id);
create index if not exists reservation_charges_fee_id_idx on reservation_charges (fee_id);
create index if not exists reservation_charges_owner_id_idx on reservation_charges (owner_id);
create index if not exists reservation_guests_guest_id_idx on reservation_guests (guest_id);
create index if not exists reservation_guests_owner_id_idx on reservation_guests (owner_id);

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));
