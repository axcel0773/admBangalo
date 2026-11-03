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
| 3 | Chalés, taxas, hóspedes, reservas, calendário | ⬜ próxima |
| 4 | Cobranças, pagamentos e financeiro | ⬜ |
| 5 | Qualidade, segurança e deploy em produção | ⬜ |
| 6 | Extras (PDF, WhatsApp, iCal, push) | ⬜ |

---

## Etapa 0 — Fundação do repositório e qualidade

Boas práticas que valem para todas as etapas seguintes.

- [ ] Iniciar o Git (`git init`) e fazer o primeiro commit
- [ ] Criar repositório remoto (GitHub) privado
- [ ] Definir fluxo de branches: `main` protegida + `feat/*`, `fix/*` via Pull Request
- [ ] Adotar Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- [ ] Hooks de pré-commit (Husky + lint-staged): lint, Prettier e typecheck nos arquivos alterados
- [ ] CI no GitHub Actions: `npm ci` → `lint` → `typecheck` → `test` → `build` em todo PR
- [ ] Dependabot (ou Renovate) para atualizar dependências
- [ ] Arquivo `.nvmrc` fixando a versão do Node
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

## Etapa 3 — Cadastros, reservas e calendário ⬜

### Chalés e taxas (Configurações)
- [ ] Feature `chalets`: listar, criar, editar, desativar (nome, capacidade, hóspedes inclusos, diária, cor, horários)
- [ ] Feature `fees`: taxas por chalé ou gerais, com os 5 modos de cobrança e "aplicar automático"
- [ ] Tarifas sazonais (`chalet_rates`) com período e mínimo de noites
- [ ] Editar perfil (nome, nome do negócio, chave Pix)

### Hóspedes
- [ ] Lista com busca por nome, CPF ou telefone (índice `gin` já existe)
- [ ] Ficha do hóspede: dados, preferências, histórico de estadias
- [ ] Criar e editar hóspede; validar CPF e telefone (`zod`)
- [ ] Atalho para WhatsApp (`wa.me`)

### Reservas
- [ ] Nova reserva em 3 etapas: estadia → hóspedes → valores
- [ ] Checar disponibilidade com `chalet_is_available` antes de salvar
- [ ] Prévia de valores com `quoteStay` (mesma regra do banco)
- [ ] Nomes de todos os hóspedes (`reservation_guests`), um marcado como responsável
- [ ] Tratar os erros do banco (sobreposição, capacidade) com mensagens amigáveis
- [ ] Lista de reservas com filtros (chalé, período, status, pagamento)
- [ ] Mudança de status: confirmar, check-in, check-out, cancelar
- [ ] Usar transação ou RPC para gravar reserva + hóspedes de uma vez (evitar dado parcial)

### Calendário
- [ ] Celular: seletor de semana + lista por chalé
- [ ] Desktop: grade chalés × dias com barras de reserva
- [ ] Dias livres clicáveis abrindo a nova reserva já preenchida
- [ ] Bloqueios de manutenção (avaliar nova tabela `chalet_blocks`)

### Boas práticas desta etapa
- [ ] Toda Server Action valida com `zod` e retorna erros por campo
- [ ] `revalidatePath` após gravar, para o Painel refletir na hora
- [ ] Testes de domínio para cada regra nova
- [ ] Componentes de formulário reutilizáveis (Select, Stepper, DateRange) em `components/ui`

---

## Etapa 4 — Cobranças, pagamentos e financeiro ⬜

- [ ] Detalhe da reserva: hospedagem, taxas, desconto, total, pago e saldo
- [ ] Lançar leitura do medidor (entrada e saída) com teclado numérico
- [ ] Adicionar e remover taxas avulsas na reserva
- [ ] Registrar pagamento (sinal, parcela, saldo, estorno) com método e data
- [ ] Parcelas previstas (`payment_schedule`) com vencimento
- [ ] Upload de comprovante no bucket privado `receipts` (descomentar a política na migração)
- [ ] "Copiar Pix com valor" (chave do perfil + saldo)
- [ ] Tela Financeiro: previsto × recebido × a receber por mês, limpeza e energia
- [ ] Gráfico dos últimos 6 meses
- [ ] Exportar CSV do mês
- [ ] Testes cobrindo estorno, pagamento maior que o total e reserva cancelada

---

## Etapa 5 — Qualidade, segurança e produção ⬜

### Testes
- [ ] Testes de componentes (Testing Library) nas peças críticas: formulários e saldo
- [ ] Testes de ponta a ponta (Playwright) no fluxo principal: login → nova reserva → pagamento
- [ ] Testes do banco: RLS (usuário A não vê dados de B) e triggers, rodando no CI com Supabase local
- [ ] Meta de cobertura do domínio ≥ 90%

### Segurança
- [ ] Revisar RLS de todas as tabelas e do Storage
- [ ] Garantir que a chave `service_role` nunca vá para o cliente
- [ ] Cabeçalhos de segurança (CSP, `X-Frame-Options`, `Referrer-Policy`) no `next.config.ts`
- [ ] Limite de tentativas de login (configuração do Supabase Auth)
- [ ] LGPD: os dados dos hóspedes (CPF, telefone) só aparecem para o dono; definir política de retenção

### Acessibilidade e desempenho
- [ ] Auditoria Lighthouse (PWA, desempenho, acessibilidade ≥ 90)
- [ ] Navegação por teclado e leitor de tela nas telas principais
- [ ] Contraste de cores validado (WCAG AA)
- [ ] Testar em celular real com 3G lento

### Deploy e operação
- [ ] Ambientes separados: desenvolvimento, preview (PR) e produção
- [ ] Deploy na Vercel ligado ao GitHub
- [ ] Projeto Supabase de produção separado do de desenvolvimento
- [ ] Migrações aplicadas via CLI (`supabase db push`), nunca editando o banco à mão
- [ ] Backups automáticos do banco (verificar o plano do Supabase) e teste de restauração
- [ ] Monitoramento de erros (Sentry ou similar) e logs
- [ ] Domínio próprio + HTTPS

---

## Etapa 6 — Extras ⬜

- [ ] Recibo ou contrato da reserva em PDF
- [ ] Mensagem de confirmação pronta para o WhatsApp
- [ ] Importar e exportar calendário iCal (Airbnb e Booking) para evitar reserva dupla
- [ ] Notificação push do check-in do dia (Web Push + Edge Function agendada)
- [ ] Modo offline com fila de lançamentos (avaliar conflitos antes)
- [ ] Fotos reais dos chalés no lugar das ilustrações
- [ ] Multiproprietário ou equipe (o schema já tem `owner_id` em tudo)

---

## Decisões em aberto

| Tema | Opções | Impacto |
| --- | --- | --- |
| Cobrança de energia | medidor (kWh) × fixo por diária | campos na reserva e no check-out |
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
