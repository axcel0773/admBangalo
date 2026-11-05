-- 0015: situação do orçamento (rascunho → enviado → aceito/recusado).
-- "Vencido" não é gravado: é derivado de valid_until (um orçamento vencido ainda pode estar "enviado").

alter table quotes
  add column status text not null default 'draft'
  check (status in ('draft', 'sent', 'accepted', 'declined'));

create index on quotes (owner_id, status);
