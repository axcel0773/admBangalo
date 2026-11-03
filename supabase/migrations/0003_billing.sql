-- =====================================================================
-- 0003 — Cobranças e pagamentos (parte 4)
-- Aplicar depois da 0002, no SQL Editor do Supabase.
-- =====================================================================

-- Cidade do recebedor: campo obrigatório do "Pix copia e cola" (BR Code).
alter table profiles add column if not exists pix_city text;

-- Pagamentos: só estorno em reserva cancelada, e estorno nunca maior que o pago.
-- O app já valida antes de gravar; aqui é a garantia final do banco.
create or replace function check_payment_rules() returns trigger
language plpgsql as $$
declare
  v_status reservation_status;
  v_paid numeric;
begin
  select status into v_status from reservations where id = new.reservation_id;

  if new.kind <> 'refund' and v_status = 'cancelled' then
    raise exception 'Reserva cancelada: só é possível lançar estorno.'
      using errcode = 'check_violation';
  end if;

  if new.kind = 'refund' then
    select coalesce(sum(case when kind = 'refund' then -amount else amount end), 0)
      into v_paid
      from payments
     where reservation_id = new.reservation_id
       and id is distinct from new.id;
    if new.amount > v_paid then
      raise exception 'O estorno passa do que foi pago.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists payments_rules on payments;
create trigger payments_rules
  before insert or update on payments
  for each row execute function check_payment_rules();

-- Consultas do Financeiro (pagamentos por data e reservas por check-in já têm índice na 0001).
create index if not exists reservation_charges_kind_idx on reservation_charges (reservation_id, kind);
