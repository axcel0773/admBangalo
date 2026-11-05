-- 0016: controle de limpeza. A lista de faxinas vem das saídas (reservas); esta tabela
-- guarda só as que já foram feitas (linha existe = limpeza feita).

create table cleaning_tasks (
  reservation_id uuid primary key references reservations(id) on delete cascade,
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  done_at        timestamptz not null default now()
);
create index on cleaning_tasks (owner_id);

alter table cleaning_tasks enable row level security;
create policy "owner access" on cleaning_tasks for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
