# Segurança e LGPD

Revisão da parte 5. Vale para desenvolvimento e produção.

## Chaves do Supabase

| Chave | Onde pode estar | Onde **nunca** pode estar |
| --- | --- | --- |
| URL do projeto | `.env.local`, Vercel (`NEXT_PUBLIC_SUPABASE_URL`) | — |
| Publishable / anon | `.env.local`, Vercel (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) | — (é pública por desenho; o RLS protege os dados) |
| Secret / service_role | só no processo dos testes E2E com Supabase **local** | código do app, `NEXT_PUBLIC_*`, Vercel, Git |

O teste `src/lib/secrets-guard.test.ts` falha se `service_role`, `SERVICE_ROLE_KEY` ou `sb_secret_…` aparecer em `src/`.
Se uma chave secreta vazar: Supabase → Project Settings → API Keys → **revogar e gerar outra**.

## RLS (Row Level Security)

| Objeto | Proteção |
| --- | --- |
| `profiles` | `id = auth.uid()` |
| `chalets`, `chalet_rates`, `fees`, `guests`, `reservations`, `reservation_guests`, `reservation_charges`, `payments`, `payment_schedule` | RLS ligado; política única `owner_id = auth.uid()` para usuários logados; `owner_id` preenchido por padrão com `auth.uid()` |
| Views `reservation_financials`, `monthly_summary`, `occupancy_days` | `security_invoker = true`: respeitam o RLS de quem consulta |
| Funções `create_reservation`, `chalet_is_available`, `anonymize_guest` | `security invoker` (RLS vale), `search_path` fixo, execução só para `authenticated` |
| `chalet_blocks`, `chalet_ical_sources` | RLS `owner_id = auth.uid()`; `anon` sem acesso |
| Função `ical_feed(token)` (link iCal público) | `security definer` liberada para `anon` **de propósito**: o Airbnb/Booking lê sem login. Devolve só datas ocupadas e o nome do chalé, nunca hóspedes; o token (UUID aleatório) limita a um chalé e pode ser trocado |
| `handle_new_user` (trigger) | `security definer` com `search_path` fixo; sem permissão de execução pela API |
| Papel `anon` (visitante sem login) | sem nenhum privilégio em tabelas, views e sequências do `public` (migração 0005) |
| `quotes` (orçamentos) | RLS com política do dono (`owner_id = auth.uid()`), `anon` sem acesso; o servidor recalcula os valores com as taxas e a capacidade do banco (o navegador só sugere); limite de 6 pessoas por constraint |
| Storage `avatars` | bucket privado (1 MB, só JPG/PNG/WebP); ler, enviar e apagar só na pasta `<owner_id>/`; link assinado de 1 h; o servidor só aceita caminho da própria pasta (`isOwnAvatarPath`) e apaga a foto antiga na troca |
| Storage `receipts` | bucket privado; ler, enviar e apagar só na pasta `<owner_id>/`; links assinados de 1 h; o banco confere o caminho salvo no pagamento |

Testado em `supabase/tests/database/01_rls.test.sql`: o dono B não vê nem altera nada do dono A, e o visitante sem login não acessa as tabelas.

## Regras críticas no banco

As regras que não podem falhar ficam no Postgres, e não só na tela:

- sem reservas sobrepostas no mesmo chalé;
- capacidade máxima do chalé;
- taxas automáticas aplicadas na criação da reserva;
- energia calculada a partir da leitura do medidor;
- estorno limitado ao que foi pago;
- reserva cancelada só aceita estorno;
- temporadas sem sobreposição;
- reserva com dinheiro registrado (pagamentos − estornos ≠ 0) não pode ser excluída: gatilho `reservations_delete_guard` (migração 0008). Apagar o chalé ou a conta, que exclui em cascata, não passa por essa regra.

Testadas em `supabase/tests/database/02_rules.test.sql`.

## Aplicação

- **Cabeçalhos** (`src/lib/security-headers.ts`, aplicados no `next.config.ts`):
  - CSP: só o próprio site e o Supabase; sem iframes (`frame-ancestors 'none'`); sem plugins;
  - `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (apenas câmera, para fotografar comprovantes);
  - HSTS quando o site é servido em HTTPS.
- **Validação:** toda Server Action valida a entrada com zod no servidor. O RLS confere de novo no banco.
- **IDs das actions:** argumentos de `.bind(null, id)` chegam do navegador **sem criptografia** (só variáveis capturadas em closures são criptografadas pelo Next). Toda action confere os ids com `isUuid`/`assertIds` (`src/lib/ids.ts`) antes de ir ao banco; o RLS continua impedindo mexer em dados de outro dono.
- **Erros:** em produção o Next esconde a mensagem de erros lançados. Ações de um botão usam `attempt` (`src/lib/actions.ts`) e `<ActionForm>`, que mostram a mensagem amigável ao lado do botão; o resto cai na tela genérica, sem detalhes técnicos.
- **CSV:** as exportações passam por `src/lib/csv.ts`, que neutraliza texto começando com `= + - @` (CSV injection: um nome de hóspede não vira fórmula no Excel). Os downloads exigem login e saem com `Cache-Control: no-store`.
- **Sessão:** o `proxy.ts` renova a sessão e manda para `/login` quem não está logado. O destino do login (`next`) aceita apenas caminhos internos (`safeRedirectPath`).
- **Importação de iCal:** o servidor só busca links `https://` com nome público (sem IP, `localhost` ou rede interna), com prazo de 10 s e até 2 MB, e grava com a sessão do dono (RLS), sem chave secreta.
- **Uploads:** o tipo e o tamanho do arquivo são conferidos no navegador, no servidor (caminho), no bucket (`allowed_mime_types` e 5 MB) e no banco.

## Login

- Limites de tentativa no Supabase Auth: no painel, em **Authentication → Rate Limits**. Os valores do ambiente local estão em `supabase/config.toml`, na seção `[auth.rate_limit]`.
- Recomendado em produção:
  - desligar o cadastro público (**Authentication → Sign In / Providers → Allow new users to sign up = off**), já que o app é só do proprietário;
  - senha forte;
  - **Leaked password protection** ligado.

## LGPD

- **Quem vê:** os dados dos hóspedes (CPF, telefone, e-mail) aparecem apenas para o proprietário dono do cadastro (RLS). Não vão para logs nem para serviços de terceiros.
- **Finalidade:** reserva, contato e emissão de cobrança. Não há marketing nem compartilhamento.
- **Direito de exclusão:** na ficha do hóspede, **Excluir hóspede**. Isso chama `remove_guest`, que:
  - sem reservas como responsável: apaga o cadastro de vez;
  - com reservas: chama `anonymize_guest` (apaga nome, CPF, nascimento, telefone, e-mail, cidade e observações do hóspede e dos acompanhantes das reservas dele), marca `deleted_at` e tira o hóspede das listas;
  - mantém as reservas e os pagamentos, sem identificar a pessoa, para a contabilidade.
- **Retenção:**
  - dados pessoais de hóspedes sem reserva há mais de **5 anos** devem ser anonimizados;
  - registros financeiros são guardados por 5 anos, o prazo fiscal.

  Revise uma vez por ano. A automação dessa revisão está nos extras (etapa 6).
- **Comprovantes:** ficam em um bucket privado e são apagados junto com o lançamento.
