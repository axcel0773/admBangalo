import "server-only";

import { env } from "@/lib/env";

import type { VapidKeys } from "./web-push";

/**
 * Chaves VAPID vêm só de variáveis de ambiente do servidor (Vercel). Sem elas, as notificações
 * ficam desativadas e a tela de Configurações avisa, em vez de quebrar.
 */
export function vapidFromEnv(): VapidKeys | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: process.env.VAPID_SUBJECT || env.NEXT_PUBLIC_SITE_URL };
}
