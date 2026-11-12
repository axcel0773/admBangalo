# Notificações push — configuração

Aviso **diário** (cerca de 8h, horário de Brasília) com as chegadas e saídas do dia e as cobranças vencidas.
Só é enviado se houver algo a avisar. O plano gratuito da Vercel permite **1 execução de cron por dia**, por isso
é uma mensagem única. Funciona também no iPhone (iOS 16.4+), mas só com o app **instalado na tela inicial**.

## Como funciona

1. Em **Configurações → Notificações**, a pessoa toca em *Ativar neste aparelho*. O navegador cria uma inscrição
   (`PushSubscription`) e o app a guarda em `push_subscriptions` (RLS: só o dono).
2. O cron da Vercel (`vercel.json`) chama `GET /api/cron/avisos` todo dia às 11:00 UTC.
3. A rota confere `Authorization: Bearer <CRON_SECRET>` e chama a função do banco `push_digest`, que devolve, por
   aparelho, os números do dia do dono. Ela exige o mesmo segredo (guardado no banco só como hash SHA-256).
   É o mesmo padrão do link iCal: **nenhuma chave `service_role` no app**.
4. O servidor cifra a mensagem (Web Push, RFC 8291) e envia ao serviço de push do navegador. Aparelhos que
   respondem 404/410 são removidos (`push_forget`).

Não há dependência npm: VAPID e a criptografia estão em `src/features/notifications/web-push.ts`, só com o módulo
`crypto` do Node, e têm teste de ida e volta (`web-push.test.ts`).

## Configuração (uma vez)

1. **Banco** — rodar a migração `0017_push.sql` e depois definir o segredo (troque pelo seu texto, 16+ caracteres):

   ```sql
   insert into push_cron_secret (secret_hash)
   values (encode(extensions.digest('SEU-SEGREDO-AQUI', 'sha256'), 'hex'));
   ```

2. **Vercel → Settings → Environment Variables** (Production):

   | Variável | Valor |
   |---|---|
   | `CRON_SECRET` | o mesmo `SEU-SEGREDO-AQUI` |
   | `VAPID_PUBLIC_KEY` | chave pública (base64url, 87 caracteres) |
   | `VAPID_PRIVATE_KEY` | chave privada (base64url, 43 caracteres) — **nunca** no repositório |
   | `VAPID_SUBJECT` | `mailto:seu-email` (opcional; padrão: `NEXT_PUBLIC_SITE_URL`) |

   Para gerar um par de chaves: `node scripts/gerar-vapid.mjs`.

3. Fazer um novo deploy e, em Configurações, ativar e tocar em *Enviar teste*.

Para trocar o segredo: `update push_cron_secret set secret_hash = encode(extensions.digest('NOVO', 'sha256'), 'hex');`
e atualizar `CRON_SECRET`. Para trocar as chaves VAPID, gere outro par, atualize as variáveis e peça para ativar
as notificações de novo em cada aparelho (inscrições antigas deixam de valer).

## Regra de "cobrança vencida"

Estadia não cancelada que já começou (check-in antes de hoje) e ainda tem saldo em aberto. É uma regra simples,
pensada para o aviso; o Painel (“Precisa de atenção”) usa o cálculo completo com as parcelas.
