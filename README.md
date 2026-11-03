# admBangalo

Gestão de chalés para o proprietário: hóspedes, calendário de reservas, valores a receber e recebidos, e taxas (energia, limpeza, pessoa extra).
**Next.js 16 + TypeScript + Supabase**, PWA **mobile first**.

## Status

| Parte | Conteúdo | Situação |
| --- | --- | --- |
| 1 | Arquitetura, schema do banco, telas | ✅ `docs/`, `supabase/migrations/` |
| 2 | Projeto base: login, app shell, PWA, tipos, Painel | ✅ este código |
| 3 | Chalés e taxas, hóspedes, reservas, calendário | 🟡 branch `feat/parte-3` |
| 4 | Cobranças, pagamentos, financeiro | — |

## Como rodar

Pré-requisitos: Node 20.11+ e um projeto no [Supabase](https://supabase.com).

```bash
# 1. dependências
npm install

# 2. variáveis de ambiente
cp .env.example .env.local      # no Windows: copy .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. banco (uma vez)
#    cole, em ordem, os arquivos de supabase/migrations/ no SQL Editor do Supabase
#    (0001_init.sql, 0002_create_reservation.sql)
#    ou: npx supabase link --project-ref <ref> && npx supabase db push

# 4. crie seu usuário
#    Supabase → Authentication → Users → Add user (e-mail + senha)

# 5. desenvolvimento
npm run dev                     # http://localhost:3000
```

No celular, na mesma rede Wi-Fi: `npm run dev -- -H 0.0.0.0` e abra `http://IP-DO-PC:3000`.
O service worker só liga em produção. Para testar a instalação do PWA, rode `npm run build && npm start`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build de produção com webpack (exigido pelo PWA/Serwist) e servidor |
| `npm run lint` | ESLint (inclui a regra de camadas) |
| `npm run typecheck` | TypeScript estrito |
| `npm test` | testes de domínio (Vitest) |
| `npm run db:types` | regenera `src/types/database.ts` a partir do banco |

## Estrutura

```
src/
├─ app/                 # rotas (App Router): só compõem features
│  ├─ (auth)/login      # tela de login
│  ├─ (app)/            # rotas protegidas + casca de navegação
│  ├─ auth/callback     # retorno do link mágico
│  ├─ manifest.ts       # manifest do PWA
│  └─ sw.ts             # service worker (Serwist)
├─ components/
│  ├─ ui/               # design system: Button, Card, Badge, Avatar…
│  ├─ layout/           # AppShell, Sidebar, BottomNav, PageHeader
│  └─ illustrations/    # paisagem dos chalés
├─ features/            # uma pasta por domínio do negócio
│  ├─ auth/
│  ├─ dashboard/        # data/ → domain/ → services/ → components/
│  ├─ chalets/ fees/ profile/   # configurações
│  ├─ guests/           # hóspedes
│  ├─ reservations/     # nova reserva, lista, detalhe, status
│  └─ calendar/         # semana (celular) e grade (desktop)
├─ lib/                 # infraestrutura: supabase, env, datas, formatação
└─ types/database.ts    # tipos do banco
```

Os padrões de código e de arquitetura estão em [`docs/padroes.md`](docs/padroes.md).
