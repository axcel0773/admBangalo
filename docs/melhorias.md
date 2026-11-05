# Melhorias sugeridas — backlog com esforço e guia de implementação

**Última atualização:** 05/11/2026 (lote M entregue + ajustes de busca e aparência) · Complementa `docs/etapas.md` (o que já foi feito), `docs/padroes.md` e `docs/arquitetura.md`.

**Já feitas (05/11):** todas as de esforço **P** e **M** — 1, 2, 3, 4, 5, 6, 7 (já existia), 8, 10, 11, 12 e 17 (✅). **Faltam** só as de esforço G: 9, 13, 14, 15 e 16. Migrações novas: `0013` (sinal), `0014` (despesas), `0015` (status do orçamento), `0016` (limpeza).

**Esforço:** **P** = até meio dia · **M** = 1 a 2 dias · **G** = 3 dias ou mais. Considera código, testes, migração e documentação.
**Restrição fixa:** tudo precisa continuar rodando no plano **gratuito** da Vercel e do Supabase.

---

## Resumo e ordem sugerida

| # | Melhoria | Esforço | Banco (migração) | Prioridade |
| --- | --- | --- | --- | --- |
| 1 | Sinal (entrada) em orçamentos e reservas ✅ | M | sim | Alta |
| 2 | Lembretes de WhatsApp prontos ✅ | P | não | Alta |
| 3 | "Ações de hoje" no Painel ✅ | M | não | Alta |
| 4 | Orçamentos com status ✅ | M | sim | Média |
| 5 | Duplicar reserva/orçamento e "reservar de novo" ✅ | P | não | Média |
| 6 | Controle de limpeza ✅ | M | sim | Média |
| 7 | Leitura de medidor (kWh) no check-in/out ✅ | M | sim | Alta |
| 8 | Despesas por bangalô ✅ | M | sim | Alta |
| 9 | Tarifas sazonais e mínimo de noites | G | sim | Média |
| 10 | Relatórios e exportação CSV/PDF ✅ | M | não | Média |
| 11 | Hóspedes recorrentes (marcas e filtros) ✅ | P | sim | Baixa |
| 12 | Comparativo de meses ✅ | P | não | Baixa |
| 13 | Notificações push (PWA) | G | sim | Média |
| 14 | Modo offline (leitura) | G | não | Baixa |
| 15 | Histórico de alterações e exportação de dados | G | sim | Média |
| 16 | Acesso de equipe (perfil limitado) | G | sim | Baixa |
| 17 | Refinos de interface (contagem nos atalhos, busca global ao vivo, modo escuro com escolha manual) ✅ | P–M | não | Baixa |

**Ordem recomendada:** 1 → 2 → 3 → 7 → 8 → 4 → 5 → 6 → 10 → 9 → demais. (Feitas até a 10; segue a 9.)

---

## Regras gerais (valem para TODAS as melhorias)

Siga estas regras para não criar despadronização. Elas resumem `docs/padroes.md`; em caso de dúvida, copie a feature existente mais parecida (`quotes/` é o melhor modelo atual).

### Camadas de uma feature (`src/features/<nome>/`)
Ordem de criação e de dependência (cada camada só importa as anteriores):

1. `domain/` — regras puras (sem React, sem Supabase), **sempre com teste** (`*.test.ts`, Vitest).
2. `schemas.ts` — validação `zod` (entrada de formulários e ações). Mensagens em português.
3. `data/<nome>.repository.ts` — único lugar que fala com o Supabase da feature; usa `unwrapList`/`unwrap*` de `src/lib/supabase`. Nunca acessar o Supabase fora de `src/lib/supabase` e de `data/` (há regra de lint).
4. `services/` — casos de uso, `import "server-only"`; combinam repositórios + domínio.
5. `actions.ts` — `"use server"`; use `attempt()` e `assertIds`, valide com o schema, **recalcule no servidor** (o navegador só sugere valores) e chame `revalidatePath`.
6. `components/` — UI. Componentes de cliente (`"use client"`) **nunca** importam o `index.ts` da feature (ele puxa `server-only`); exponha só código seguro para o navegador em `client.ts`.
7. `index.ts` — barrel público; telas importam daqui, não de arquivos internos.

### Banco (Supabase)
- Migração nova em `supabase/migrations/NNNN_descricao.sql` (próximo número livre; hoje a última é a `0012`). Nunca editar migração já aplicada.
- Toda tabela com **RLS ligada** e política "dono" (`owner_id = auth.uid()`), como em `quotes`. Índices nas chaves estrangeiras (ver `0011`).
- Teste **pgTAP** em `supabase/tests/` para cada regra de banco/RLS nova.
- Atualizar `src/types/database.ts` (ou gerar com `npm run db:types`). Campos JSON: usar `type`, não `interface`, para caber em `Json`.
- Aplicar em **dev** primeiro; em **produção** só com autorização do dono, colando o SQL no SQL Editor e conferindo com consulta de leitura.
- Arquivos (fotos/anexos): bucket **privado**, política por pasta do dono, URL assinada de 1 h, caminho validado no servidor (modelo: `avatars` e `chalet-photos`).

### Interface
- **Mobile first** (390 px primeiro, depois `md:`), tokens do `globals.css` (`bg-primary`, `bg-accent-soft`, `text-ink-muted`…); **nunca** cores hexadecimais soltas em componentes (exceção: ilustrações SVG e PDFs).
- Reuse `components/ui` (Button, Card, Badge, Field, EmptyState, IconTile, ListRow…). Ícones só do `lucide-react`.
- Todo texto em português; usar o termo **"bangalô"** (o código e as URLs seguem `chalet`/`chales`).
- Estados de carregamento, vazio e erro em toda tela nova. Alvos de toque ≥ 44 px; `aria-label` em botões só com ícone.
- Navegação nova: registrar em `components/layout/navigation.ts` (`routes`, `paths`, itens de menu), não escrever URLs soltas.

### PDFs e mensagens
- PDFs com `pdf-lib` no navegador, só caracteres WinAnsi: passe todo texto por `winAnsiSafe`/`wrapText` de `src/lib/pdf.ts` (emojis são removidos). Mensagens de WhatsApp (texto) podem ter emoji.
- Compartilhar PDF com `PdfShare` (Web Share API com `File`).

### Qualidade antes do PR
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`); um PR por melhoria; branch `feat/<nome>`.
- Rodar `npm run lint && npm run typecheck && npm test && npm run build`; E2E (Playwright) quando houver fluxo novo.
- Atualizar `docs/etapas.md` (e `arquitetura.md`/`seguranca.md` quando mudar modelo de dados ou segurança). Fechar o PR com o rodapé de atribuição do projeto.
- Antes de implementar algo **visual**, mostrar prévia de design e esperar aprovação (combinado com o dono).

---

## 1. Sinal (entrada) em orçamentos e reservas — esforço **M** ✅

**Objetivo:** definir um percentual de sinal e mostrar "pague R$ X para garantir" com a chave Pix no PDF e na mensagem.

**Onde mexer**
- `features/billing/domain` (já tem regras de pagamento): função pura `suggestedDeposit(total, percent)` com arredondamento em centavos + teste.
- Perfil (`features/profile`): campo "Sinal padrão (%)" (`profiles.default_deposit_percent`, 0–100, padrão 30). Migração `0013`, atualizar tipos e schema do perfil.
- `features/quotes`: adicionar `deposit_amount` (calculado no **servidor** na action de criar orçamento, a partir do percentual do perfil) e exibir em `QuoteDocument` (`quote-document.ts`), no cartão, no PDF (`quote-pdf.ts`, bloco "Como reservar") e em `quoteMessage`.
- `features/reservations`: reaproveitar o mesmo cálculo ao criar reserva pendente (campo de sinal já existe na etapa de preço; apenas pré-preencher).

**Cuidados:** nunca confiar em valor vindo do navegador; teste de domínio para 0 %, 100 % e centavos; PDF com `winAnsiSafe`.

## 2. Lembretes de WhatsApp prontos — esforço **P** ✅

**Objetivo:** botões com mensagem escrita para: antes da chegada (instruções + horário), cobrança de saldo e pós-estadia (agradecimento/avaliação).

**Onde mexer**
- `features/reservations/domain/messages.ts` (já concentra os textos): novas funções puras `arrivalReminderMessage`, `balanceReminderMessage`, `thanksMessage` + testes (mesmo estilo de `messages.test.ts`). Use `firstName` e o nome do bangalô.
- UI: botão "WhatsApp" em `today-agenda.tsx` (chegadas/saídas) e na ficha da reserva, reaproveitando o link `wa.me` já usado em outros pontos (não duplicar a montagem do link: extrair um helper em `src/lib` se ainda estiver repetido).
- Texto editável por modelo: **fase 2** (tabela de modelos); começar com textos fixos.

**Cuidados:** telefone normalizado (só dígitos, DDI 55); não enviar nada automaticamente — o dono toca e o WhatsApp abre.

## 3. "Ações de hoje" no Painel — esforço **M** ✅

**Objetivo:** lista priorizada do que precisa de atenção: saldos vencidos, chegadas sem sinal pago, orçamentos que vencem em até 2 dias.

**Onde mexer**
- `features/dashboard/domain/build-dashboard.ts`: nova função pura `buildTodayActions(...)` (entrada: reservas, pagamentos, orçamentos; saída: itens `{ type, title, subtitle, href, severity }`) + testes cobrindo cada tipo.
- `dashboard.repository.ts`: incluir a consulta de orçamentos a vencer (uma consulta, sem N+1).
- Componente `components/today-actions.tsx` acima da agenda; cada item é um `Link` para a tela de resolução (use `paths.*`).
- Estado vazio positivo ("Tudo em dia 🎉") e limite de 5 itens com "ver todos".

**Cuidados:** sem consultas por item; datas sempre pelo `lib/dates` (fuso de São Paulo).

## 4. Orçamentos com status — esforço **M** ✅

**Objetivo:** enviado → aceito/recusado/expirado, e aviso quando as datas ficam ocupadas por outra reserva.

**Onde mexer**
- Migração: `quotes.status` (`draft|sent|accepted|declined`) com check; `expired` é **derivado** de `valid_until` (não guardar). Teste pgTAP.
- `features/quotes/domain`: `quoteStatus(quote, today)` puro + testes; `datesStillFree` reaproveita `features/availability` (via `client.ts`/serviço, conforme o lado).
- Action `setQuoteStatus` (com `assertIds`); ao usar "Criar reserva", marcar `accepted` automaticamente.
- UI: `Badge` de status na lista e filtro por status (`?status=` na URL, como `?q=` em hóspedes).

## 5. Duplicar reserva/orçamento e "reservar de novo" — esforço **P** ✅

**Onde mexer:** reaproveite o pré-preenchimento já existente em `reservas/nova` (`saida`, `adultos`, `criancas`, `nome`, `telefone`) via `paths.newReservation`/`paths.newQuote`. Botão "Reservar de novo" na ficha do hóspede e "Duplicar" no orçamento levam à tela de criação com os campos preenchidos (datas em branco). **Sem migração.**

**Cuidados:** não copiar valores antigos; o cálculo é refeito com as taxas atuais.

## 6. Controle de limpeza — esforço **M** ✅

**Objetivo:** para cada saída, uma tarefa de limpeza com status (pendente/feita) e mensagem para a faxineira.

**Onde mexer**
- Migração `cleaning_tasks` (`reservation_id`, `chalet_id`, `due_date`, `done_at`) com RLS dono e índices; pgTAP.
- Feature `cleaning/` em camadas (modelo: `quotes/`). Tarefas **derivadas** das saídas já existentes: criar sob demanda (upsert por `reservation_id`) em vez de trigger, para ficar simples de testar.
- UI: aba/seção "Limpeza" na agenda do dia e no calendário; botão "Feita" (action) e "Avisar faxineira" (mensagem WhatsApp com bangalô e horário, função pura em `domain`).

## 7. Leitura de medidor (kWh) no check-in/out — esforço **M** ✅ (já existia)

> **Nota:** já estava pronto antes do lote M — `EnergyCard`, `saveMeterReading`, `meter.ts`, `reservation_charges.meter_start/meter_end` e `estimateEnergy` no billing. Nada novo foi necessário.

**Objetivo:** registrar a leitura na entrada e na saída e calcular a taxa de energia automaticamente (hoje sai "a calcular").

**Onde mexer**
- A taxa por medição já existe (`fees` com modo medido; `QuoteLine.pending`). Migração: `reservations.meter_in`/`meter_out` (numeric, ≥ 0, `meter_out >= meter_in`) com check + pgTAP.
- `features/billing/domain`: `meteredCharge(meterIn, meterOut, pricePerUnit)` puro e testado; integrar ao total/saldo existente **sem** duplicar a regra no front.
- UI: campos na ficha da reserva (check-in e check-out) com `inputMode="decimal"`; ao salvar a saída, a action recalcula a cobrança e atualiza o saldo; recibo mostra consumo e valor.

**Cuidados:** reservas antigas continuam funcionando (campos opcionais); arredondar em centavos.

## 8. Despesas por bangalô — esforço **M** ✅

**Objetivo:** lançar gastos (luz, manutenção, limpeza, compras) e ver **lucro** no Financeiro.

**Onde mexer**
- Migração `expenses` (`chalet_id` opcional, `category`, `amount`, `spent_on`, `notes`, `receipt_path` opcional) com RLS dono + índices; pgTAP. Comprovante opcional segue o modelo do bucket `receipts`.
- Feature `expenses/` em camadas; categorias como constante tipada em `domain`.
- `features/finance/domain.ts`: estender o relatório mensal com `expenses` e `profit` (puro, testado, incluindo mês sem despesas). Mostrar no `finance-summary` e em `revenue-breakdown` (cores só por token).
- Rota `financeiro/despesas` (lista + nova) ligada ao menu do Financeiro, sem item novo na barra inferior.

## 9. Tarifas sazonais e mínimo de noites — esforço **G**

**Objetivo:** preços por período (feriados, alta temporada) e mínimo de noites. Já previsto como `chalet_rates` na etapa 4.

**Onde mexer**
- Migração `chalet_rates` (`chalet_id`, `starts_on`, `ends_on`, `nightly_rate`, `min_nights`), com **exclusão de sobreposição** por bangalô (como `reservations_no_overlap`) e pgTAP.
- Domínio: `reservations/domain/quote.ts` (cálculo único usado por reservas **e** orçamentos) passa a somar diária por noite conforme a tarifa vigente; erro de mínimo de noites em `issues`. Testes de virada de período, mínimo e noite fora de qualquer tarifa (usa diária base).
- UI: sub-tela em Configurações › Bangalôs › Tarifas (lista, criar, editar, excluir com confirmação em dois toques).

**Cuidados:** é a mudança com maior risco de regressão no preço — cobrir com testes antes de mexer e manter a cópia de valores guardada nas reservas/orçamentos já criados.

## 10. Relatórios e exportação — esforço **M** ✅

**Onde mexer**
- `features/finance` ganha `reports/`: ocupação por mês e por bangalô, diária média, origem da reserva (campo `source` já usado no iCal). Cálculos puros em `domain` + testes; consultas agregadas no repositório (uma por relatório).
- Exportar **CSV** no navegador (função pura `toCsv` em `src/lib`, com escape de aspas/ponto e vírgula e BOM UTF-8 para abrir bem no Excel) e **PDF** reaproveitando `src/lib/pdf.ts`.
- Tela `financeiro/relatorios` com seletor de período (`?de=&ate=`), gráficos simples em SVG/CSS (sem biblioteca pesada).

## 11. Hóspedes recorrentes — esforço **P** ✅

**Onde mexer:** `guests` ganha `tags text[]` (ou apenas derivar "recorrente" por contagem de reservas, **sem** migração — preferível para começar). Marca "Cliente fiel" na lista/ficha, filtro `?filtro=recorrentes` e aniversariante do mês (se houver data de nascimento). Regras em `guests/domain` + testes.

## 12. Comparativo de meses — esforço **P** ✅

**Onde mexer:** função pura em `finance/domain.ts` (`compareMonths(current, previous)` → variação em R$ e %, tratando mês anterior zerado) + testes; exibir seta e % no `finance-summary`. Sem banco.

## 13. Notificações push (PWA) — esforço **G**

**Objetivo:** avisos de chegadas do dia, pagamentos vencidos e novas reservas do iCal.

**Onde mexer**
- Web Push com VAPID (gratuito). Tabela `push_subscriptions` (RLS dono). Chaves VAPID **somente** em variáveis de ambiente do servidor (validar em `lib/env.ts`); nunca no repositório.
- Service worker (Serwist) trata `push`/`notificationclick`. Envio por **Vercel Cron** (plano gratuito: 1 execução/dia por cron) numa rota protegida por segredo (`CRON_SECRET`).
- Tela de preferências em Configurações (ligar/desligar por tipo). iPhone exige PWA instalado (iOS 16.4+): documentar.

**Cuidados:** limite de 1 cron diário no plano gratuito — agrupar tudo numa mensagem diária; remover inscrições expiradas (HTTP 404/410).

## 14. Modo offline (leitura) — esforço **G**

**Onde mexer:** cache do service worker para telas de leitura (Painel, calendário, reserva) com estratégia *stale-while-revalidate* e aviso "Dados de HH:mm (sem conexão)". **Não** permitir gravações offline na primeira versão (evita conflito de dados). Testar com Playwright em modo offline. Serwist exige build com `--webpack` (já configurado).

## 15. Histórico de alterações e exportação — esforço **G**

**Onde mexer**
- Migração `audit_log` (`table_name`, `row_id`, `action`, `old`, `new`, `changed_at`) alimentada por **triggers** nas tabelas críticas (reservas, pagamentos, taxas), RLS só leitura para o dono, retenção (ex.: 12 meses) para caber no plano gratuito. pgTAP para as triggers.
- Tela "Histórico" na ficha da reserva (linha do tempo).
- **Exportação completa** (JSON/CSV zip) em Configurações › Dados, gerada no servidor por uma action autenticada — serve de backup manual, já que o plano gratuito não guarda backups longos.

## 16. Acesso de equipe — esforço **G**

**Onde mexer:** novo papel (`member`) em `profiles`/tabela `team_members`; **todas** as políticas RLS precisam passar a considerar o papel (revisar migração por migração) e a UI esconder Financeiro/Configurações. É a melhoria que mais mexe em segurança: exige revisão em `docs/seguranca.md`, testes pgTAP de "membro não lê financeiro" e E2E com dois usuários. Só fazer depois de 6 (limpeza), que é o caso de uso.

## 17. Refinos de interface — esforço **P a M** ✅

- **Contagem de hóspedes nos atalhos do Painel (P) — ✅ feito (PR #42):** adicionar `guestCount` ao `buildDashboard` (consulta `count` exata, sem listar linhas) e usar em `shortcuts.tsx`.
- **Busca global (M) — ✅ feito (PRs #51 e #55):** tela `/busca` (feature `search/`) que busca **ao vivo** enquanto se digita (espera 200 ms, ação `searchSuggest`, só a última resposta vale). Mostra, nesta ordem: atalhos de **páginas** ("Ir para": Painel, Calendário, Reservas, Orçamentos, Hóspedes, Financeiro, Despesas, Relatórios, Limpeza, Bangalôs, Taxas e Configurações, com palavras-chave como "clientes" e "faxina"), e **conteúdos**: hóspedes (nome, documento, telefone), reservas (hóspede ou bangalô) e orçamentos (hóspede). A palavra é **completada em cinza** no campo ("ho" → "Hóspedes"; Tab ou seta direita aceitam). Mínimo de 2 letras, 8 resultados por grupo, sem acento e sem diferenciar maiúsculas. O campo do Painel agora só leva a esta tela (já com o teclado aberto) e há o item "Buscar" no menu lateral. Regras de páginas e de completar em `search/domain.ts` (testadas); lista de páginas em `search/pages.ts`. A primeira versão (busca por GET com botão) foi substituída.
- **Modo escuro (M) — ✅ feito (PRs #51, #53, #54 e #56):** tokens em `globals.css` para o aparelho escuro (`prefers-color-scheme`) **e** para a escolha manual (`data-theme="dark"|"light"` no `<html>`), contrastes conferidos (≥ 4,5:1), `themeColor` por esquema e impressão do recibo de volta ao claro. A escolha **Claro / Escuro / Automático** fica em **Configurações → Aparência** (`components/layout/theme-chooser.tsx`), guardada no aparelho (`localStorage`, chave `tema`) e aplicada por um script no `<head>` antes da primeira pintura (sem piscar); no automático segue o aparelho, inclusive se ele mudar com o app aberto. Regras em `lib/theme.ts` (testadas).
  - **Lição aprendida:** o botão de tema foi tentado primeiro no cabeçalho do Painel e no menu lateral (#53/#54) e **quebrou o layout do Painel** (para o menu abrir sem ser cortado, o cabeçalho precisou de `z-20` e cobriu os cartões que sobem sobre a faixa azul). Foi desfeito (#56) e a escolha foi para Configurações. Regra: **não mexer no empilhamento (`z-index`/`overflow`) do cabeçalho do Painel**; controles novos de preferência vão em Configurações.
  - Cores fixas no código devem virar token (ex.: `bg-tile-slate`, `bg-peach-soft`); evitar `dark:` do Tailwind, que só segue o aparelho e ignora a escolha manual.

---

## Checklist de PR para qualquer melhoria

- [ ] Camadas respeitadas (domain → schemas → data → services → actions → components → index) e `client.ts` quando houver código de cliente
- [ ] Regra de negócio com teste de domínio; valores sempre recalculados no servidor
- [ ] Migração numerada + RLS + índices + pgTAP; aplicada em dev; produção só com autorização
- [ ] Tokens de cor/ícones do `lucide-react`; mobile first (390 px) e desktop; estados de carregamento, vazio e erro
- [ ] Textos em português, termo "bangalô"; rotas registradas em `navigation.ts`
- [ ] PDFs com `winAnsiSafe`; nada de segredos no código
- [ ] `lint`, `typecheck`, `test`, `build` verdes; `docs/etapas.md` atualizado


> **Status: feito (05/11).** Botões *Lembrar da chegada*, *Cobrar saldo* e *Agradecer* na ficha da reserva (só os que fazem sentido hoje; cancelada não tem). Textos e a regra `availableReminders` em `reservations/domain/messages.ts`, com testes. Ficou para depois: botões direto na agenda do Painel (a linha é um link, então botão aninhado foi evitado) e modelos de texto editáveis (fase 2). PR #40.

> **Status: feito (05/11).** *Duplicar* no orçamento, *Reservar de novo* na reserva e na ficha do hóspede (já com o bangalô da última estadia). Criados `paths.newQuote` e o helper `toCount` em `src/lib/search-params.ts`; o orçamento novo aceita pré-preenchimento de bangalô, pessoas, nome e telefone. Sem migração. PR #41.

> **Status: feito (05/11).** Feito pela opção **sem migração**: recorrente = 2+ estadias não canceladas (calculado em `guests/services.ts`), selos "Cliente fiel" e "Aniversário" e filtros `?filtro=recorrentes|aniversariantes`. Tags manuais (`tags text[]`) ficam como evolução futura. PR #42.

> **Status: feito (05/11).** `compareWithPrevious` e `previousTrendPoint` em `finance/domain.ts` (testados); setas e % nos cartões Previsto e Recebido, usando a tendência de 6 meses já carregada (sem consulta extra). PR #42.