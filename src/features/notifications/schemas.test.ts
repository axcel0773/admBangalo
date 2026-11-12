import { describe, expect, it } from "vitest";

import { preferencesSchema, subscriptionSchema } from "./schemas";

const p256dh = "B".repeat(87);
const auth = "a".repeat(22);

describe("schemas de notificação", () => {
  it("aceita uma inscrição válida e recusa endpoint sem https", () => {
    expect(subscriptionSchema.safeParse({ endpoint: "https://push.example.com/x", keys: { p256dh, auth } }).success).toBe(true);
    expect(subscriptionSchema.safeParse({ endpoint: "http://push.example.com/x", keys: { p256dh, auth } }).success).toBe(false);
    expect(subscriptionSchema.safeParse({ endpoint: "https://push.example.com/x", keys: { p256dh: "curta", auth } }).success).toBe(false);
  });

  it("interruptores: ligado = on, ausente = desligado", () => {
    expect(preferencesSchema.parse({ notify_arrivals: "on" })).toEqual({ notify_arrivals: true, notify_overdue: false });
    expect(preferencesSchema.parse({})).toEqual({ notify_arrivals: false, notify_overdue: false });
  });
});
