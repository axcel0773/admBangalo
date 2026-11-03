# Deploy e operação

## Ambientes

| Ambiente | App | Banco |
| --- | --- | --- |
| Desenvolvimento | `npm run dev` no seu PC | projeto Supabase de desenvolvimento (o atual) |
| Preview (cada PR) | Vercel cria uma URL por PR | o mesmo projeto de desenvolvimento |
| Produção | Vercel, branch `main` | **projeto Supabase separado**, só com dados reais |

## 1. Supabase de produção

1. Crie um novo projeto em [supabase.com](https://supabase.com), na região **South America (São Paulo)**, com uma senha forte para o banco.
2. Aplique as migrações pela CLI. Nunca edite o banco à mão:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-do-projeto-de-produção>
   npx supabase db push          # aplica 0001 … 0005 em ordem
   ```
   Daqui em diante, toda mudança no banco é uma migração nova em `supabase/migrations/`, revisada no PR e aplicada com `db push`.
3. **Authentication → URL Configuration:**
   - Site URL: `https://SEU-DOMINIO`
   - Redirect URLs: `https://SEU-DOMINIO/auth/callback` e `https://*-SEU-TIME.vercel.app/auth/callback` (previews)
4. **Authentication → Sign In / Providers:** desligue "Allow new users to sign up" depois de criar o seu usuário (em **Authentication → Users → Add user**).
5. **Advisors → Security Advisor:** deve ficar sem alertas de erro.
6. **Backups:** o plano Pro faz backup diário, e o PITR (point-in-time recovery) é um adicional. No plano Free não há backup automático: rode `npx supabase db dump --data-only -f backup.sql` toda semana e guarde o arquivo fora do PC. Teste a restauração uma vez num projeto de teste.

## 2. Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe `axcel0773/admBangalo`.
2. **Build Command:** `npm run build`, que já usa `--webpack`, exigido pelo PWA. **Output:** padrão do Next.
3. **Environment Variables:**
   - Production: as do projeto de **produção**;
   - Preview e Development: as do projeto de **desenvolvimento**.

   | Variável | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave **publishable/anon** |
   | `NEXT_PUBLIC_SITE_URL` | `https://SEU-DOMINIO` (em produção) |

   Não cadastre a chave secreta / `service_role` na Vercel.
4. **Settings → Git:** a produção sai da `main`, e cada PR ganha uma URL de preview.
5. **Domínio:** em **Settings → Domains**, adicione o domínio e crie o registro DNS que a Vercel indicar. O HTTPS é automático. Depois atualize a Site URL no Supabase.

## 3. GitHub

- **Settings → Branches → Add rule** para a `main`:
  - exigir PR;
  - exigir os checks `Lint, tipos, testes e build` e `Banco (RLS, triggers, migrações)`;
  - bloquear push direto.
- O job **Ponta a ponta** sobe o Supabase local no próprio CI. Depois que ele ficar verde algumas vezes, inclua-o também como obrigatório.
- O Dependabot abre PRs semanais de dependências. Eles só entram se o CI passar.

## 4. Monitoramento

- **Vercel → Observability / Logs:** erros do servidor e das Server Actions.
- **Supabase → Logs:** Auth, API e Postgres.
- **Opcional (recomendado na produção):** Sentry, com `npx @sentry/wizard@latest -i nextjs`. Se ligar o Sentry, acrescente o domínio de ingestão dele em `connect-src` no `src/lib/security-headers.ts`.

## 5. Testes

| Comando | O que roda | Precisa de |
| --- | --- | --- |
| `npm test` | domínio + componentes (Vitest) | nada |
| `npm run test:coverage` | idem, com a meta de 90% no domínio | nada |
| `npm run test:db` | pgTAP: RLS e regras do banco | Docker + `npx supabase start` |
| `npm run test:e2e` | Playwright: fumaça + fluxo principal no celular | build + Supabase local |

Testes E2E no seu PC (com Docker Desktop aberto):

```bash
npx supabase start                       # sobe o Supabase local com as migrações
npx supabase status                      # mostra API URL, anon key e service_role key
# crie um .env.test.local (não vai para o Git) com:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
#   SUPABASE_SERVICE_ROLE_KEY=<service_role key>   ← só do Supabase LOCAL
npx dotenv -e .env.test.local -- npm run build
npx dotenv -e .env.test.local -- npm run test:e2e
npx supabase stop
```

O teste se recusa a rodar se a URL não for `127.0.0.1` ou `localhost`. Assim, a chave secreta da nuvem nunca é usada.
