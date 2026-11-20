-- 0018: um dono só pode apontar para registros DELE (achado da auditoria de 20/11/2026).
--
-- O RLS impede ler e alterar dados de outro dono, mas a chave estrangeira não olha o dono:
-- quem soubesse o id de um bangalô alheio conseguia criar uma reserva ou um bloqueio nele.
-- Como a regra de "sem sobreposição" vale para o bangalô inteiro e o link iCal público lê por
-- bangalô, isso permitiria travar datas de outro dono e aparecer no calendário dele.
-- Estes gatilhos exigem que bangalô, hóspede e reserva referenciados tenham o mesmo owner_id.

create or replace function assert_same_owner(p_table regclass, p_id uuid, p_owner uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  if p_id is null then
    return;
  end if;
  execute format('select owner_id from %s where id = $1', p_table) into v_owner using p_id;
  if v_owner is null or v_owner <> p_owner then
    raise exception 'Registro relacionado não encontrado.' using errcode = 'foreign_key_violation';
  end if;
end $$;
revoke execute on function assert_same_owner(regclass, uuid, uuid) from public, anon, authenticated;

-- Bangalô referenciado (chalet_id)
create or replace function check_chalet_owner() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform assert_same_owner('chalets', new.chalet_id, new.owner_id);
  return new;
end $$;

-- Reserva referenciada (reservation_id)
create or replace function check_reservation_owner() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform assert_same_owner('reservations', new.reservation_id, new.owner_id);
  return new;
end $$;

-- Reserva: bangalô e hóspede principal do mesmo dono
create or replace function check_reservation_refs_owner() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform assert_same_owner('chalets', new.chalet_id, new.owner_id);
  perform assert_same_owner('guests', new.main_guest_id, new.owner_id);
  return new;
end $$;

-- Pessoa da reserva: reserva e cadastro do hóspede (opcional) do mesmo dono
create or replace function check_reservation_guest_owner() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform assert_same_owner('reservations', new.reservation_id, new.owner_id);
  perform assert_same_owner('guests', new.guest_id, new.owner_id);
  return new;
end $$;

revoke execute on function check_chalet_owner() from public, anon, authenticated;
revoke execute on function check_reservation_owner() from public, anon, authenticated;
revoke execute on function check_reservation_refs_owner() from public, anon, authenticated;
revoke execute on function check_reservation_guest_owner() from public, anon, authenticated;

-- "aa_" no nome: roda antes dos outros gatilhos BEFORE (capacidade, bloqueios), que leem o bangalô.
create trigger aa_owner_refs before insert or update of chalet_id, main_guest_id, owner_id on reservations
  for each row execute function check_reservation_refs_owner();
create trigger aa_owner_refs before insert or update of chalet_id, owner_id on chalet_blocks
  for each row execute function check_chalet_owner();
create trigger aa_owner_refs before insert or update of chalet_id, owner_id on chalet_ical_sources
  for each row execute function check_chalet_owner();
create trigger aa_owner_refs before insert or update of chalet_id, owner_id on chalet_rates
  for each row execute function check_chalet_owner();
create trigger aa_owner_refs before insert or update of chalet_id, owner_id on fees
  for each row execute function check_chalet_owner();
create trigger aa_owner_refs before insert or update of chalet_id, owner_id on quotes
  for each row execute function check_chalet_owner();
create trigger aa_owner_refs before insert or update of chalet_id, owner_id on expenses
  for each row execute function check_chalet_owner();
create trigger aa_owner_refs before insert or update of reservation_id, owner_id on payments
  for each row execute function check_reservation_owner();
create trigger aa_owner_refs before insert or update of reservation_id, owner_id on payment_schedule
  for each row execute function check_reservation_owner();
create trigger aa_owner_refs before insert or update of reservation_id, owner_id on reservation_charges
  for each row execute function check_reservation_owner();
create trigger aa_owner_refs before insert or update of reservation_id, owner_id on cleaning_tasks
  for each row execute function check_reservation_owner();
create trigger aa_owner_refs before insert or update of reservation_id, guest_id, owner_id on reservation_guests
  for each row execute function check_reservation_guest_owner();

-- Perfil: a política valia para "public" (inclui anônimo). Sem efeito prático (auth.uid() é nulo),
-- mas a regra do projeto é dar acesso só a "authenticated".
alter policy "own profile" on profiles to authenticated;

-- Notificações: o servidor só envia para serviços de push conhecidos (nunca para um endereço
-- qualquer informado pelo navegador, o que viraria um "proxy" de requisições do servidor).
alter table push_subscriptions add constraint push_endpoint_known_service check (
  endpoint ~ '^https://(fcm\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)/'
);
