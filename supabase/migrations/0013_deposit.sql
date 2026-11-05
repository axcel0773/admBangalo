-- 0013: sinal (entrada) sugerido.
-- profiles.default_deposit_percent: percentual padrão do sinal (0–100). 0 = não sugerir sinal.
-- quotes.deposit_amount: valor do sinal gravado no orçamento (calculado no servidor; 0 = sem sinal).

alter table profiles
  add column default_deposit_percent int not null default 30
  check (default_deposit_percent between 0 and 100);

alter table quotes
  add column deposit_amount numeric(10,2) not null default 0
  check (deposit_amount >= 0);
