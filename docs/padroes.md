# Padrões de código e arquitetura

## Arquitetura: features em camadas

Cada domínio do negócio (dashboard, reservations, guests, finance…) vive em `src/features/<nome>/`, com as mesmas pastas:

```
features/dashboard/
├─ data/        dashboard.repository.ts   → só consultas ao Supabase
├─ domain/      build-dashboard.ts        → regras puras (sem I/O), testadas
│               types.ts                  → tipos de entrada e saída
├─ services/    get-dashboard.ts          → caso de uso: chama o repository e o domínio
├─ components/  summary-cards.tsx …       → UI da feature
└─ index.ts                               → API pública da feature
```

O fluxo de dependência é sempre o mesmo:

```
app (página) → features/*/index.ts → services → data + domain
                                   ↘ components → components/ui
```

| Camada | Pode | Não pode |
| --- | --- | --- |
| `app/` (páginas) | buscar dados via service e compor componentes | falar com o Supabase, ter regra de negócio |
| `components/` | receber props e desenhar | buscar dados |
| `services/` | orquestrar repository e domínio | montar JSX |
| `data/` | consultar o Supabase via `DbClient` | calcular regras |
| `domain/` | funções puras sobre tipos simples | importar Next, React ou Supabase |
| `lib/` | infraestrutura genérica | conhecer features |

O ESLint bloqueia `@supabase/*` fora de `src/lib/supabase`. Para usar o banco, crie um repository.

Regras de negócio críticas (conflito de datas, capacidade, taxas automáticas, saldo) ficam **no banco**. O `domain/` espelha essas regras para mostrar prévias na tela (ex.: valor previsto na nova reserva). Quando houver diferença, o banco é a fonte da verdade.

## Componentização

- **`components/ui`** é o design system: peças genéricas sem regra de negócio (Button, Card, Badge, Avatar, Field, StatCard…). Variantes com `class-variance-authority`, classes combinadas com `cn()`.
- **`features/*/components`** são peças do domínio (ChaletCard, TodayAgenda). Recebem dados já prontos do domínio, nunca linhas cruas do banco.
- Uma página monta componentes; ela não deve ter mais que alguns blocos de JSX.
- Componente reaproveitado por duas features sobe para `components/ui` (genérico) ou fica na feature dona do conceito e é importado de lá (ex.: `PaymentStatusBadge` em `reservations`).
- Server Component por padrão. `"use client"` só quando há estado, efeito ou evento, e o mais folha possível (ex.: só a `BottomNav` é cliente, não o layout).

## Mobile first

- Estilos base são do celular (390 px); `md:` e `lg:` ampliam para tablet e desktop.
- Navegação: `BottomNav` no celular, `Sidebar` a partir de `md`.
- Alvos de toque ≥ 44 px; ações principais no alcance do polegar.
- Use `min-h-dvh` (não `100vh`) e as utilidades `pb-safe` / `pb-safe-nav` para a área segura do iPhone.

## Design tokens

Definidos em `src/app/globals.css` (`@theme`). Use os nomes semânticos, nunca hex solto:

| Token | Uso |
| --- | --- |
| `bg-canvas`, `bg-surface`, `bg-muted` | fundo da página, cartões, áreas neutras |
| `text-ink`, `text-ink-soft`, `text-ink-muted` | texto principal, secundário, terciário |
| `bg-primary`, `text-primary-ink`, `bg-primary-soft` | ação principal (verde-musgo), positivo |
| `bg-accent`, `text-accent-ink`, `bg-accent-soft` | valores pendentes (terracota) |
| `font-display` | títulos e números grandes (Fraunces) |

## Clean code

- **Nomes que dizem a intenção**: `listOpenBalances`, `occupiesNight`, `buildChaletOverview`. Funções booleanas começam com `is`/`has`/verbo.
- **Funções pequenas e puras** no domínio; efeitos (I/O) só em `data/` e `services/`.
- **Tipos explícitos nas fronteiras** (props, retornos de service e repository); inferência no resto.
- **Sem números mágicos**: constantes nomeadas (`UPCOMING_LIMIT`, `APP_TIME_ZONE`).
- **Datas de calendário** como `IsoDate` (`"YYYY-MM-DD"`), calculadas no fuso `America/Sao_Paulo` (`lib/dates.ts`). Nunca use `new Date("2026-11-03")` direto.
- **Dinheiro**: o banco guarda `numeric(12,2)`; no app use `roundMoney` e `formatCurrency`.
- **Erros**: repositories usam `unwrap`/`unwrapList`, que lançam `RepositoryError` com contexto; `app/(app)/error.tsx` mostra a falha amigável.
- **Validação** de entrada com `zod` em toda Server Action.
- **Comentários** explicam o *porquê*, não o *o quê*.

## Testes

- Todo arquivo de `domain/` tem um `*.test.ts` ao lado.
- Os testes usam os mesmos números validados no Postgres (ex.: reserva de R$ 1.460,28 com saldo de R$ 860,28).
- `npm test` roda tudo; `npm run test:watch` durante o desenvolvimento.

## Formulários (padrão da parte 3)

Todo formulário segue o mesmo fluxo:

```
Client Component (useActionState) → Server Action ("use server") → schema zod → repository → revalidatePath → redirect
```

- **Estado único:** toda action devolve `FormState` (`src/lib/forms.ts`): `idle`, `success` ou `error` com `fieldErrors` e `values`.
- **Valores preservados:** passe o `formData` para `invalidFormState`/`errorFormState`, e use `valueOf(state, "campo", salvo)` e `checkedOf(...)` no `defaultValue`. O React 19 reseta o formulário depois de cada envio; sem isso o usuário perde o que digitou.
- **Validação:** schemas em `features/<x>/schemas.ts`, com as peças de `src/lib/validation.ts` (`money`, `integer`, `phone`, `document`, `checkbox`…). Dinheiro sempre via `parseMoney`, a mesma regra no cliente e no servidor.
- **Erros do banco:** repositories usam `assertMutation`, que lança `MutationError` com mensagem amigável (`src/lib/supabase/errors.ts`). A action captura e devolve `errorFormState`.
- **Edição:** a página faz `updateX.bind(null, id)` e passa para o mesmo componente de formulário da criação.
- **Gravações com várias tabelas** vão para uma função do Postgres (ex.: `create_reservation`), para não deixar dado parcial.
- **Ações destrutivas** pedem confirmação em dois toques (`ConfirmSubmit`), sem `window.confirm`.
- **Celular:** ações do formulário em `FormActions` (fixo acima da barra inferior); campos numéricos com `inputMode="decimal"`/`"tel"`.

## Estado na URL

Filtros, busca e período ficam na URL (`?q=`, `?ver=`, `?chale=`, `?inicio=&dia=`), não em estado do cliente. Assim, o voltar do navegador funciona, o link pode ser compartilhado e a página continua sendo Server Component. Rotas com parâmetros são montadas por `paths.*` em `components/layout/navigation.ts`.

## Checklist de nova feature

1. Tipos de entrada/saída em `domain/types.ts`.
2. Regras puras em `domain/*.ts` + testes.
3. Consultas em `data/<feature>.repository.ts`.
4. Caso de uso em `services/`.
5. Componentes em `components/` (mobile first).
6. Exportar o necessário em `index.ts` e compor na página em `app/`.
