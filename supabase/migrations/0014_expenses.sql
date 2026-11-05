-- 0014: despesas (luz, limpeza, manutenção, compras…), com ou sem bangalô específico.
-- Servem para o Financeiro mostrar o lucro do mês (caixa recebido − despesas).

create table expenses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chalet_id   uuid references chalets(id) on delete set null,   -- vazio = despesa geral
  category    text not null check (category in ('energy', 'cleaning', 'maintenance', 'supplies', 'taxes', 'other')),
  description text check (description is null or length(description) <= 120),
  amount      numeric(10,2) not null check (amount > 0),
  spent_on    date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on expenses (owner_id, spent_on desc);
create index on expenses (chalet_id);

create trigger t_expenses_upd before update on expenses for each row execute function set_updated_at();

alter table expenses enable row level security;
create policy "owner access" on expenses for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
