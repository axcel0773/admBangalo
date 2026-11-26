-- 0021: itens quebrados e consumo separados das taxas na reserva.
--
-- Relato da usuária: o formulário único de "taxa avulsa" misturava a taxa de limpeza com
-- "louça quebrada". Agora a reserva tem dois grupos: Taxas (limpeza, pet, energia, outra) e
-- Itens quebrados e consumo (kind = 'item'). O item soma no total como qualquer cobrança.
-- Só lançamentos na reserva usam 'item'; o cadastro de taxas (fees) não oferece esse tipo.
alter type fee_kind add value if not exists 'item';
