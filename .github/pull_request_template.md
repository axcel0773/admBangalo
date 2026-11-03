## O que muda

<!-- Uma ou duas frases. Ex.: "Registra pagamento com comprovante na reserva." -->

## Como testar

- [ ] No celular (ou DevTools em modo celular):
- [ ] No desktop:

## Checklist

- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam
- [ ] Regras novas têm teste (domínio em `*.test.ts`, banco em `supabase/tests`)
- [ ] Migração nova em `supabase/migrations/` (nunca editar uma já aplicada)
- [ ] Sem segredos no código; `service_role` nunca no app
- [ ] `docs/etapas.md` atualizado
