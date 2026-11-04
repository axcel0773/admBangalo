-- 0007: excluir hóspedes e limite de 6 pessoas por bangalô (regra do condomínio).

-- 1) Capacidade: no máximo 6 pessoas; sem taxa de pessoa extra.
--    base_guests passa a ser igual à capacidade (todos inclusos na diária).
update chalets set max_guests = least(max_guests, 6);
update chalets set base_guests = max_guests where base_guests <> max_guests;

alter table chalets add constraint chalets_max_guests_limit check (max_guests <= 6);
-- Reservas antigas com mais pessoas continuam (not valid); novas e alterações respeitam o limite.
alter table reservations
  add constraint reservations_guests_limit check (adults + children <= 6) not valid;

update fees set active = false, auto_apply = false where kind = 'extra_guest';

-- 2) Hóspedes excluídos somem das listas.
alter table guests add column deleted_at timestamptz;
create index guests_active_idx on guests (owner_id) where deleted_at is null;

-- Quem já teve os dados apagados (LGPD) também sai da lista.
update guests set deleted_at = now() where full_name = 'Hóspede removido' and deleted_at is null;

-- Exclui o hóspede. Sem reservas como responsável: apaga o cadastro.
-- Com reservas: apaga os dados pessoais (anonymize_guest) e arquiva, para o
-- financeiro continuar fechando. security invoker: o RLS limita ao dono.
create or replace function remove_guest(p_guest_id uuid) returns text
language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from guests where id = p_guest_id and deleted_at is null) then
    raise exception 'Hóspede não encontrado.' using errcode = 'no_data_found';
  end if;

  if exists (select 1 from reservations where main_guest_id = p_guest_id) then
    perform anonymize_guest(p_guest_id);
    update guests set deleted_at = now() where id = p_guest_id;
    return 'archived';
  end if;

  delete from guests where id = p_guest_id;
  return 'deleted';
end $$;

revoke execute on function remove_guest(uuid) from public, anon;
grant  execute on function remove_guest(uuid) to authenticated;
