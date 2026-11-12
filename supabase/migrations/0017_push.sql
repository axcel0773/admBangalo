-- 0017: notificações push (aviso diário de chegadas, saídas e cobranças vencidas).
--
-- O envio roda num cron da Vercel, sem usuário logado e sem a chave service_role (que o projeto
-- não usa no app). Por isso a leitura dos dados do aviso é uma função `security definer`
-- protegida por um segredo, no mesmo padrão do link iCal. O segredo fica no banco só como hash.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Aparelhos inscritos (um por navegador/aparelho)
-- ---------------------------------------------------------------------
create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint    text not null unique check (endpoint ~ '^https://'),
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
create index on push_subscriptions (owner_id);

alter table push_subscriptions enable row level security;
create policy "owner access" on push_subscriptions for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
revoke all on push_subscriptions from anon;

-- Preferências do aviso diário
alter table profiles
  add column notify_arrivals boolean not null default true,
  add column notify_overdue  boolean not null default true;

-- ---------------------------------------------------------------------
-- Segredo do cron (só o hash). Ninguém lê a tabela pela API.
-- ---------------------------------------------------------------------
create table push_cron_secret (
  secret_hash text not null
);
alter table push_cron_secret enable row level security;
revoke all on push_cron_secret from anon, authenticated;

create or replace function check_push_secret(p_secret text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_secret is null or length(p_secret) < 16
     or not exists (
       select 1 from push_cron_secret
       where secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
     ) then
    raise exception 'não autorizado' using errcode = '28000';
  end if;
end $$;
revoke execute on function check_push_secret(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Dados do aviso: uma linha por aparelho inscrito, com os números do dia do dono.
-- "Vencida" = a estadia já começou (check-in antes de hoje) e ainda há saldo em aberto.
-- ---------------------------------------------------------------------
create or replace function push_digest(p_secret text, p_today date)
returns table (
  endpoint        text,
  p256dh          text,
  auth            text,
  arrivals        int,
  departures      int,
  overdue_count   int,
  overdue_amount  numeric
)
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform check_push_secret(p_secret);

  return query
  select
    s.endpoint,
    s.p256dh,
    s.auth,
    case when pr.notify_arrivals then (
      select count(*)::int from reservations r
      where r.owner_id = s.owner_id and r.status <> 'cancelled' and r.check_in = p_today
    ) else 0 end,
    case when pr.notify_arrivals then (
      select count(*)::int from reservations r
      where r.owner_id = s.owner_id and r.status <> 'cancelled' and r.check_out = p_today
    ) else 0 end,
    case when pr.notify_overdue then (
      select count(*)::int from reservation_financials f
      where f.owner_id = s.owner_id and f.status <> 'cancelled' and f.balance_due > 0 and f.check_in < p_today
    ) else 0 end,
    case when pr.notify_overdue then (
      select coalesce(sum(f.balance_due), 0) from reservation_financials f
      where f.owner_id = s.owner_id and f.status <> 'cancelled' and f.balance_due > 0 and f.check_in < p_today
    ) else 0 end
  from push_subscriptions s
  join profiles pr on pr.id = s.owner_id;
end $$;

-- Remove aparelho que o serviço de push informou como expirado (HTTP 404/410).
create or replace function push_forget(p_secret text, p_endpoint text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform check_push_secret(p_secret);
  delete from push_subscriptions where endpoint = p_endpoint;
end $$;

revoke execute on function push_digest(text, date) from public;
revoke execute on function push_forget(text, text) from public;
grant execute on function push_digest(text, date) to anon, authenticated;
grant execute on function push_forget(text, text) to anon, authenticated;
