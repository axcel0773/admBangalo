import { z } from "zod";

/**
 * Serviços de push dos navegadores (Chrome/Android, Firefox, Safari/iPhone, Edge).
 * O servidor só envia para eles: aceitar qualquer endereço faria do app um "proxy"
 * de requisições (SSRF). O banco tem a mesma regra (migração 0018).
 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];

export function isKnownPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}

/** Inscrição enviada pelo navegador (PushSubscription.toJSON()). */
export const subscriptionSchema = z.object({
  endpoint: z.string().max(1000).refine(isKnownPushEndpoint, "Serviço de notificação desconhecido."),
  keys: z.object({
    p256dh: z.string().min(80).max(100).regex(/^[A-Za-z0-9_-]+$/),
    auth: z.string().min(20).max(30).regex(/^[A-Za-z0-9_-]+$/),
  }),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

/** Interruptores de HTML só enviam "on" quando ligados. */
export const preferencesSchema = z.object({
  notify_arrivals: z.string().optional().transform((value) => value === "on"),
  notify_overdue: z.string().optional().transform((value) => value === "on"),
});
