import { z } from "zod";

/** Inscrição enviada pelo navegador (PushSubscription.toJSON()). */
export const subscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
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
