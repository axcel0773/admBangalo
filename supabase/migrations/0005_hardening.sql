-- =====================================================================
-- 0005 — Endurecimento de segurança (parte 5)
-- Aplicar depois da 0004. Pode ser reaplicada sem efeito colateral.
-- Resolve os avisos do Security Advisor do Supabase
-- ("function_search_path_mutable") e fecha o acesso do papel anon.
-- =====================================================================

-- 1) search_path fixo: impede que um objeto com o mesmo nome em outro
--    schema seja usado no lugar do nosso dentro das funções.
alter function set_updated_at()                                 set search_path = public, pg_temp;
alter function handle_new_user()                                set search_path = public, pg_temp;
alter function check_reservation_capacity()                     set search_path = public, pg_temp;
alter function charges_sync_meter()                             set search_path = public, pg_temp;
alter function apply_default_fees()                             set search_path = public, pg_temp;
alter function chalet_is_available(uuid, date, date, uuid)      set search_path = public, pg_temp;
alter function create_reservation(jsonb)                        set search_path = public, pg_temp;
alter function check_payment_rules()                            set search_path = public, pg_temp;

-- 2) Funções chamáveis pela API: só usuários logados.
--    (O Postgres dá EXECUTE a PUBLIC por padrão.)
revoke execute on function create_reservation(jsonb)                   from public, anon;
revoke execute on function chalet_is_available(uuid, date, date, uuid) from public, anon;
grant  execute on function create_reservation(jsonb)                   to authenticated;
grant  execute on function chalet_is_available(uuid, date, date, uuid) to authenticated;

-- Funções de trigger não são chamadas pela API; handle_new_user é security definer.
revoke execute on function handle_new_user() from public, anon, authenticated;

-- 3) O app não usa o papel anon em tabelas nem views: o RLS já devolveria
--    zero linhas, mas sem privilégio nem a estrutura fica exposta.
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- 4) LGPD: anonimizar um hóspede mantendo o histórico financeiro das reservas.
--    security invoker: o RLS garante que só o dono do hóspede consegue.
create or replace function anonymize_guest(p_guest_id uuid) returns void
language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  update guests
     set full_name  = 'Hóspede removido',
         document   = null,
         birth_date = null,
         phone      = null,
         email      = null,
         city       = null,
         state      = null,
         notes      = null
   where id = p_guest_id;
  if not found then
    raise exception 'Hóspede não encontrado.' using errcode = 'no_data_found';
  end if;

  -- Cópias do nome do hóspede nas reservas (responsável ou acompanhante cadastrado).
  update reservation_guests
     set full_name = 'Hóspede removido',
         document  = null
   where guest_id = p_guest_id;

  -- Pessoas das reservas em que ele foi o responsável.
  update reservation_guests rg
     set full_name = case when rg.is_main then 'Hóspede removido' else 'Acompanhante removido' end,
         document  = null
    from reservations r
   where rg.reservation_id = r.id
     and r.main_guest_id = p_guest_id;
end $$;

revoke execute on function anonymize_guest(uuid) from public, anon;
grant  execute on function anonymize_guest(uuid) to authenticated;
