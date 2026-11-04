-- 0008: trava para excluir reservas.
-- Reserva com dinheiro registrado (pagamentos − estornos ≠ 0) não pode ser excluída:
-- sumiria do Financeiro e do recibo sem deixar rastro. Estorne tudo antes.
-- A regra vive no banco, então vale para qualquer caminho de exclusão (app, SQL, API).

create or replace function check_reservation_delete() returns trigger
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_paid numeric;
begin
  -- Exclusão em cascata (apagar o chalé ou a conta inteira) não passa por esta regra:
  -- ali quem decide é quem apaga o dono dos dados.
  if pg_trigger_depth() > 1 then
    return old;
  end if;

  select coalesce(sum(case when kind = 'refund' then -amount else amount end), 0)
    into v_paid
    from payments
   where reservation_id = old.id;

  if v_paid <> 0 then
    raise exception 'Esta reserva tem pagamentos lançados. Estorne todo o valor pago antes de excluir.'
      using errcode = 'check_violation';
  end if;

  return old;
end $$;

drop trigger if exists reservations_delete_guard on reservations;
create trigger reservations_delete_guard
  before delete on reservations
  for each row execute function check_reservation_delete();
