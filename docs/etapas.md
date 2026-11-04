# Controle de etapas do desenvolvimento

Acompanhamento do projeto **admBangalo** (gestão de chalés · Next.js + TypeScript + Supabase · PWA mobile first).

**Legenda:** `[x]` feito · `[ ]` a fazer · ⚠️ feito, mas falta validar

**Última atualização:** 03/11/2026

---

## Visão geral

| Etapa | Escopo | Situação |
| --- | --- | --- |
| 0 | Fundação do repositório e qualidade | 🟡 em andamento |
| 1 | Arquitetura, banco e telas | ✅ concluída |
| 2 | Projeto base (auth, shell, PWA, Painel) | 🟢 rodando no localhost; faltam testes de PWA e lint |
| 3 | Chalés, taxas, hóspedes, reservas, calendário | ✅ validada; merge da `feat/parte-3` via PR |
| 4 | Cobranças, pagamentos e financeiro | 🟡 4a e 4b prontas na branch `feat/parte-4`, falta validar |
| 5 | Qualidade, segurança e deploy em produção | ✅ em produção: https://admbangalo.vercel.app (faltam: URLs de login no Supabase e seu usuário) |
| 6 | Extras (bloqueios, iCal Airbnb/Booking, WhatsApp, recibo) | ✅ na `main` e em produção (push, offline, fotos e equipe ficaram para depois) |

---

## Etapa 0 — Fundação do repositório e qualidade

Boas práticas que valem para todas as etapas seguintes.

- [x] Iniciar o Git (`git init`) e fazer o primeiro commit
- [x] Repositório remoto no GitHub (`axcel0773/admBangalo`) com push da `main`
- [x] Repositório **público** (decisão para ter proteção de branch grátis); histórico verificado sem segredos, chave secreta nunca no código
- [x] `main` protegida no GitHub (repositório público): exige PR e o check "Lint, tipos, testes e build"
- [x] Dependabot só com atualizações minor/patch no npm; majors à mão
- [x] Adotar Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- [x] Hooks (Husky + lint-staged): ESLint e Prettier no pre-commit; typecheck e testes no pre-push
- [x] CI no GitHub Actions (`.github/workflows/ci.yml`): qualidade, banco (pgTAP) e E2E em todo PR
- [x] Dependabot semanal (npm agrupado) e mensal (Actions)
- [x] Arquivo `.nvmrc` fixando o Node 22 (usado pelo CI)
- [x] Modelo de Pull Request com checklist
- [x] `.gitignore` sem segredos nem artefatos de build
- [x] `.env.example` documentando as variáveis
- [x] ESLint, Prettier e TypeScript estrito configurados
- [x] Guia de padrões de código e arquitetura (`docs/padroes.md`)

---

## Etapa 1 — Arquitetura, banco e telas ✅

- [x] Levantamento de requisitos e decisões assumidas (vários chalés, taxas configuráveis, pagamento manual)
- [x] Documento de arquitetura (`docs/arquitetura.md`)
- [x] Schema do banco (`supabase/migrations/0001_init.sql`)
  - [x] 10 tabelas + 3 views (`reservation_financials`, `monthly_summary`, `occupancy_days`)
  - [x] Bloqueio de reservas sobrepostas (`exclude using gist`)
  - [x] Validação de capacidade do chalé (trigger)
  - [x] Taxas automáticas ao criar reserva (5 modos de cobrança)
  - [x] Energia por medidor (leitura final − inicial × tarifa)
  - [x] RLS por proprietário em todas as tabelas; views com `security_invoker`
- [x] Schema testado em Postgres 16 (sobreposição, capacidade, totais, saldo, RLS)
- [x] Telas: 6 do celular + 5 do desktop, estilo "natural acolhedor", mobile first
- [ ] Decidir: energia por medidor (kWh) **ou** valor fixo por diária? (o banco aceita os dois; muda as telas)
- [ ] Revisar com o proprietário as taxas reais e os valores das diárias

---

## Etapa 2 — Projeto base 🟡

### Feito

- [x] Next.js 15 (App Router) + TypeScript estrito + Tailwind v4
- [x] Arquitetura por features em camadas (`data` → `domain` → `services` → `components`)
- [x] Regra de lint impedindo acesso ao Supabase fora de `src/lib/supabase`
- [x] Clientes Supabase (server, browser, middleware) com `@supabase/ssr`
- [x] Validação das variáveis de ambiente com `zod` (`src/lib/env.ts`)
- [x] Tipos do banco (`src/types/database.ts`) espelhando a migração
- [x] Autenticação: e-mail + senha e link mágico, callback, sair da conta
- [x] Middleware protegendo as rotas e renovando a sessão
- [x] Proteção contra redirecionamento aberto (`safeRedirectPath`)
- [x] Design system (`components/ui`): Button, Card, Badge, Avatar, Field, StatCard, ProgressBar, EmptyState, Skeleton, Money, IconTile
- [x] App shell mobile first: barra inferior no celular, sidebar a partir de `md`
- [x] PWA: manifest, ícones (incluindo maskable), service worker (Serwist), página offline
- [x] Painel com dados reais: indicadores, agenda do dia, chalés, a receber, próximas chegadas
- [x] Estados de carregamento, erro, vazio e 404
- [x] Migração para Next.js 16 (03/11): build com `--webpack` por causa do Serwist, `next lint` → `eslint .`, ESLint 10 com config nativa do `eslint-config-next`
- [x] Regras de preço e pagamento no domínio, espelhando o banco
- [x] 29 testes de domínio passando (preço, pagamentos, datas, Painel)
- [x] README com passo a passo

### Falta

- [x] `npm install` e `npm run dev` funcionando na máquina local (Next 16)
- [ ] Rodar `npm run build` (com `--webpack`) e `npm start` para validar o PWA de produção
- [x] `npm run typecheck` passando
- [ ] Rodar `npm run lint` e `npm test` e corrigir o que aparecer
- [x] Projeto no Supabase criado, `.env.local` configurado (URL base + Publishable key)
- [ ] Gerar os tipos reais com `npm run db:types` e comparar com os manuais
- [x] Login com senha e navegação por todas as telas testados no localhost
- [ ] Testar o link mágico (configurar Site URL e Redirect URLs no Supabase)
- [ ] Conferir o Painel com o `seed.sql` (agenda, chalés, a receber)
- [ ] Instalar o PWA no celular (Android e iPhone) e validar ícone, tela cheia e área segura
- [x] `src/middleware.ts` → `src/proxy.ts` (convenção do Next 16, via codemod)
- [x] Removido o `export const instant = false` que o codemod inseriu (exige `cacheComponents`, que não usamos)
- [ ] Avaliar `@serwist/turbopack` quando estiver estável, para voltar o build ao Turbopack
- [x] Criar `supabase/seed.sql` com chalés, taxas e reservas de exemplo (datas relativas a hoje)
- [x] Typecheck passando no Next 16 (`@supabase/ssr` atualizado)
- [ ] Configurar no Supabase a URL do site e as URLs de redirecionamento do link mágico

---

## Etapa 3 — Cadastros, reservas e calendário ✅

> Código na branch `feat/parte-3`, migração `0002` aplicada e fluxo testado no localhost e no celular. Tarifas sazonais foram para a etapa 4; bloqueios de manutenção seguem em avaliação.

### Chalés e taxas (Configurações)
- [x] Feature `chalets`: listar, criar, editar, desativar (nome, capacidade, hóspedes inclusos, diária, cor, horários)
- [x] Feature `fees`: taxas por chalé ou gerais, com os 5 modos de cobrança e "aplicar automático"
- [ ] Tarifas sazonais (`chalet_rates`) com período e mínimo de noites → movido para a etapa 4
- [x] Editar perfil (nome, nome do negócio, telefone, chave Pix)

### Hóspedes
- [x] Lista com busca por nome, CPF ou telefone (`?q=` na URL)
- [x] Ficha do hóspede: dados, observações, histórico de estadias e total em reservas
- [x] Criar e editar hóspede; validação de CPF (dígitos verificadores), telefone, e-mail e UF
- [x] Atalho para WhatsApp (`wa.me`) e e-mail

### Reservas
- [x] Nova reserva em 3 etapas: estadia → hóspedes → valores, com prévia de valores ao vivo
- [x] Prévia com as mesmas regras do banco (`quoteDraft` → `quoteStay`), testada contra o valor do Postgres
- [x] Responsável: hóspede cadastrado (com busca) ou novo; nomes dos acompanhantes e crianças
- [x] Gravação atômica via função `create_reservation` (migração `0002`): hóspede + reserva + pessoas
- [x] Erros do banco (sobreposição, capacidade) traduzidos em mensagens amigáveis
- [x] Lista com filtros por situação (próximas, hospedados, pendentes, finalizadas, canceladas) e chalé
- [x] Detalhe: resumo, pessoas, hospedagem e taxas, saldo
- [x] Mudança de status com máquina de estados (confirmar → check-in → check-out; cancelar com confirmação)
- [x] Pré-preenchimento pela URL (`?chale=&entrada=&hospede=`), usado pelo calendário e pela ficha do hóspede

### Calendário
- [x] Celular: semana com pontos de ocupação + agenda do dia por chalé (entrada, saída, troca, livre)
- [x] Desktop: grade de 2 semanas, chalés × dias, reservas como barras (pendentes tracejadas)
- [x] Dias livres clicáveis abrindo a nova reserva já preenchida
- [x] Bloqueios de manutenção (`chalet_blocks`, feito na etapa 6)

### Boas práticas desta etapa
- [x] Toda Server Action valida com `zod` e retorna erros por campo (`FormState`)
- [x] Valores enviados voltam no erro (o React 19 reseta o formulário após cada envio)
- [x] `revalidatePath` após gravar, para Painel, calendário e listas refletirem na hora
- [x] Testes de domínio para cada regra nova (62 testes no total)
- [x] Componentes reutilizáveis em `components/ui`: SelectField, TextareaField, SwitchField, NumberStepper, SubmitButton, FormAlert, FormSection, ListRow, FilterChips, SearchForm, StepIndicator, ColorSwatchField

### Validar antes do merge
- [x] Aplicar `supabase/migrations/0002_create_reservation.sql` no SQL Editor do Supabase
- [x] `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` (lint pediu ajuste ao React Compiler no formulário de reserva)
- [x] Testar no celular: cadastrar chalé e taxa, criar reserva, mudar status, navegar no calendário
- [ ] Abrir o PR `feat/parte-3` → `main`, revisar e fazer o merge

---

## Etapa 4 — Cobranças, pagamentos e financeiro 🟡

> Branch `feat/parte-4`. 4a: energia, taxas avulsas, pagamentos, Pix e Financeiro. 4b: parcelas, comprovantes e temporadas.
> Aplicar `0003_billing.sql` e `0004_receipts.sql` no Supabase antes de testar.

### Energia (decidido: medidor, R$ 1,00 por kWh)
- [x] Cartão "Energia" na reserva: leitura de entrada e de saída com teclado numérico
- [x] Prévia ao vivo: consumo × tarifa; o total entra na reserva pela cobrança `metered`
- [x] Aviso do que falta anotar (entrada antes do check-in, saída no check-out)
- [x] Reserva sem cobrança de energia ganha uma ao salvar a leitura (usa a taxa por medidor do chalé ou a geral)
- [x] Seed com a tarifa de R$ 1,00/kWh
- [ ] Cadastrar/ajustar no app a taxa "Energia elétrica": modo **Leitura do medidor**, R$ 1,00

### Taxas e pagamentos
- [x] Adicionar e remover taxas avulsas na reserva (remoção com confirmação em dois toques)
- [x] Registrar pagamento (sinal, parcela, saldo, estorno) com forma, data e observação
- [x] Remover lançamento errado (confirmação em dois toques)
- [x] Regras: pagamento até o saldo; estorno até o que foi pago; cancelada só aceita estorno — no app e no banco (trigger `check_payment_rules`)
- [x] "Pix copia e cola" com o valor do saldo (BR Code com CRC16, testado contra o exemplo do Banco Central)
- [x] Enviar a cobrança com o código Pix pelo WhatsApp do hóspede
- [x] Cidade do recebedor no perfil (`profiles.pix_city`, exigida pelo Pix)

### Parte 4b
- [x] Parcelas previstas (`payment_schedule`): adicionar, remover e atalho "sinal 50% hoje + saldo no check-in"
- [x] Situação de cada parcela (paga, parcial, vencida, vence hoje, a vencer), distribuindo o pago por vencimento
- [x] Aviso de valor sem parcela (ou parcelas acima do total) e Pix só da próxima parcela
- [x] Painel: "A receber" vence na próxima parcela em aberto (sem parcelas, no check-in) e ordena pelo vencimento
- [x] Comprovante no pagamento: foto (reduzida no celular) ou PDF até 5 MB, direto para o bucket privado `receipts`
- [x] Link temporário (1 h) para abrir o comprovante; remover o lançamento apaga o arquivo
- [x] Migração `0004`: bucket, políticas por pasta do dono e checagem do caminho no pagamento
- [x] Tarifas por temporada no chalé (nome, período, diária, mínimo de noites; sem sobreposição)
- [x] Nova reserva: cada noite usa a diária da temporada; a diária sugerida é a média, com o detalhe por temporada na prévia
- [x] Aviso (sem bloquear) quando a estadia não atinge o mínimo de noites da temporada

### Financeiro
- [x] Mês na URL (`?mes=2026-11`) com setas de mês anterior/próximo
- [x] Indicadores: previsto, recebido, a receber e ocupação do mês
- [x] Composição: hospedagem, limpeza, energia e outras taxas; entradas de caixa por forma de pagamento
- [x] Gráfico previsto × recebido dos últimos 6 meses (com tabela para leitor de tela)
- [x] Reservas do mês com total e saldo
- [x] Exportar CSV do mês (`;` e vírgula decimal, abre direto no Excel)

### Testes
- [x] Domínio: leitura do medidor, regras de pagamento (estorno, pagamento maior que o saldo, reserva cancelada), Pix, relatório do mês, tendência e CSV
- [x] Domínio 4b: parcelas (distribuição, vencimento, sugestão), comprovantes (caminho e tipo), temporadas (noites por período, média, mínimo) — 104 testes no total
- [x] Migração 0004 testada no Postgres: temporada sobreposta recusada, comprovante fora da pasta do dono recusado, outro usuário não vê arquivos nem parcelas
- [x] Migração 0003 testada no Postgres: energia 84,5 kWh × R$ 1,00, estorno acima do pago recusado, pagamento em cancelada recusado

### Validar antes do merge
- [ ] Aplicar `supabase/migrations/0003_billing.sql` e `0004_receipts.sql` no SQL Editor do Supabase
- [ ] Conferir em Storage que o bucket `receipts` existe e é privado
- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`
- [ ] No celular: anotar entrada e saída do medidor, adicionar taxa, registrar pagamento, copiar o Pix e colar no app do banco (sem pagar), abrir o Financeiro e exportar o CSV
- [ ] No celular (4b): criar sinal + saldo, anexar foto de comprovante, cadastrar uma temporada e simular uma reserva que a atravesse

---

## Etapa 5 — Qualidade, segurança e produção 🟡

> Código, testes e CI na branch `feat/parte-5`. O que depende de contas (Vercel, Supabase de produção, domínio) está no passo a passo de `docs/deploy.md`.
> Aplicar `supabase/migrations/0005_hardening.sql` no Supabase.

### Testes
- [x] Componentes (Testing Library + jsdom): `ConfirmSubmit`, `EnergyCard`, `QuoteSummary`
- [x] Ponta a ponta (Playwright, celular): login → chalé → nova reserva → pagamento; fumaça com acessibilidade (axe), cabeçalhos e manifest
- [x] Banco (pgTAP em `supabase/tests`): RLS entre dois donos e visitante, triggers, constraints, pagamentos, temporadas e LGPD — 25 asserções, no CI com Supabase local
- [x] Cobertura do domínio com meta de 90% de linhas (`npm run test:coverage`, quebra o CI se cair)
- [x] Guarda contra segredo no código (`src/lib/secrets-guard.test.ts`)
- [ ] Rodar o E2E no seu PC uma vez (Docker + `supabase start`) e acompanhar o primeiro CI verde

### Segurança
- [x] RLS revisado em todas as tabelas, views e no Storage (tabela em `docs/seguranca.md`)
- [x] Migração 0005: `search_path` fixo nas funções, execução só para logados, papel `anon` sem acesso
- [x] `service_role` fora do app, com teste de guarda
- [x] Cabeçalhos: CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS em HTTPS
- [x] Limites de tentativa de login no `supabase/config.toml` (local); produção no painel (ver `docs/seguranca.md`)
- [x] LGPD: dados só para o dono, "Apagar dados pessoais" na ficha do hóspede (`anonymize_guest`), política de retenção
- [x] Callback de login aceita `token_hash` (modelo de e-mail recomendado para SSR)
- [ ] No painel de produção: desligar cadastro público e conferir o Security Advisor

### Acessibilidade e desempenho
- [x] Verificação automática (axe, WCAG A/AA) na tela de login, no E2E
- [x] Lighthouse no celular, em produção (4G lento): Desempenho 100 · Acessibilidade 100 · Práticas recomendadas 100 · SEO 91 → 100 com o `robots.txt` (PR #13); LCP 0,9 s
- [ ] Navegação por teclado e leitor de tela nas telas principais
- [ ] Testar em celular real com 3G lento

### Deploy e operação (passo a passo em `docs/deploy.md`)
- [x] Projeto Supabase de produção separado (`admbangalo-prod`, São Paulo, plano Free) com as migrações aplicadas
- [x] Vercel (Hobby, gratuito) ligada ao GitHub: produção na `main`, preview por PR; funções em São Paulo (`gru1`), perto do banco
- [x] Variáveis por ambiente na Vercel: produção → `admbangalo-prod`; preview/desenvolvimento → Supabase de desenvolvimento; só chaves publishable
- [ ] URLs de redirecionamento do Auth no Supabase de produção (Site URL `https://admbangalo.vercel.app`, Redirect `https://admbangalo.vercel.app/auth/callback`) e cadastro público desligado
- [ ] Backups (plano Pro ou dump semanal) e um teste de restauração
- [ ] Monitoramento: logs da Vercel/Supabase; Sentry opcional
- [ ] Domínio próprio + HTTPS

---

## Etapa 6 — Extras 🟡

> Branch `feat/parte-6`. Aplicar `supabase/migrations/0006_availability.sql`.
> Tudo funciona nos planos gratuitos: sem cron pago, sem serviço externo e sem chave secreta no servidor.

- [x] **Bloqueios de datas** (manutenção, uso próprio) por chalé; aparecem no calendário e o banco recusa reserva por cima
- [x] **Importar iCal** do Airbnb/Booking/Google: cada chalé guarda os links; as datas ocupadas viram bloqueio "Ocupado no Airbnb"
  - sincroniza ao abrir o calendário (se faz mais de 6 h) e no botão "Sincronizar agora" — sem cron, roda com a sessão do dono (RLS)
  - bloqueio importado só **avisa** na nova reserva (o dono pode lançar aqui a mesma reserva vinda de lá)
  - proteção contra SSRF: só https, sem IP, sem rede interna, prazo de 10 s, até 2 MB
- [x] **Exportar iCal**: link `/ical/<token>.ics` por chalé para colar no Airbnb/Booking; só datas ocupadas, sem dados de hóspedes; "Gerar novo link" invalida o antigo
- [x] **Mensagem de confirmação** pronta para o WhatsApp (datas, horários, pessoas, total, pago e saldo)
- [x] **Recibo** em página própria, pronto para imprimir ou "Salvar como PDF" no celular
- [x] Testes: leitura/geração de iCal, segurança do link, bloqueios, mensagem (125 de domínio) e 9 asserções de banco para bloqueios e o link público
- [ ] Notificação push do check-in do dia — fica para depois: precisa de agendador; a Vercel gratuita só roda cron 1×/dia e exigiria chave secreta no servidor
- [ ] Modo offline com fila de lançamentos — fica para depois: conflitos de reserva (sobreposição) só se resolvem online; o PWA já abre a página offline
- [ ] Fotos reais dos chalés — conteúdo do dono (pode usar o Storage gratuito, 1 GB)
- [ ] Multiproprietário ou equipe — o schema já separa tudo por `owner_id`; falta convite e papéis

---

## Decisões tomadas

- **Energia:** leitura do medidor na entrada e na saída, R$ 1,00 por kWh (taxa `metered`).

## Decisões em aberto

| Tema | Opções | Impacto |
| --- | --- | --- |
| Bloqueio de datas | tabela nova × reserva com status especial | calendário e disponibilidade |
| Integração de pagamento | manual (atual) × Pix automático (Mercado Pago, Asaas) | etapa 4 e custos |
| Acesso de equipe | só o dono × funcionário com acesso limitado | RLS e telas |

---

## Definição de pronto (vale para toda tarefa)

Uma tarefa só vai para `[x]` quando:

1. O código segue `docs/padroes.md` (camadas, componentes, nomes)
2. `lint`, `typecheck`, `test` e `build` passam
3. Há teste para a regra de negócio nova
4. Funciona no celular (390 px) e no desktop
5. Tem estados de carregamento, vazio e erro
6. Passou por revisão em Pull Request
7. A documentação foi atualizada (este arquivo incluído)
