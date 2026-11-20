import { describe, expect, it } from "vitest";

import { isKnownPushEndpoint, preferencesSchema, subscriptionSchema } from "./schemas";

const p256dh = "B".repeat(87);
const auth = "a".repeat(22);

describe("schemas de notificação", () => {
  it("aceita uma inscrição válida e recusa endpoint sem https", () => {
    const fcm = "https://fcm.googleapis.com/fcm/send/abc";
    expect(subscriptionSchema.safeParse({ endpoint: fcm, keys: { p256dh, auth } }).success).toBe(true);
    expect(subscriptionSchema.safeParse({ endpoint: "http://fcm.googleapis.com/x", keys: { p256dh, auth } }).success).toBe(false);
    expect(subscriptionSchema.safeParse({ endpoint: fcm, keys: { p256dh: "curta", auth } }).success).toBe(false);
  });

  it("só aceita serviços de push conhecidos (sem SSRF)", () => {
    expect(isKnownPushEndpoint("https://fcm.googleapis.com/fcm/send/x")).toBe(true);
    expect(isKnownPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(isKnownPushEndpoint("https://web.push.apple.com/QW")).toBe(true);
    expect(isKnownPushEndpoint("https://wns2-bl2p.notify.windows.com/w/?token=x")).toBe(true);
    expect(isKnownPushEndpoint("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isKnownPushEndpoint("https://evilpush.apple.com.attacker.net/x")).toBe(false);
    expect(isKnownPushEndpoint("https://fcm.googleapis.com.attacker.net/x")).toBe(false);
    expect(isKnownPushEndpoint("https://user:pw@fcm.googleapis.com/x")).toBe(false);
    expect(isKnownPushEndpoint("https://fcm.googleapis.com:8443/x")).toBe(false);
    expect(isKnownPushEndpoint("nada")).toBe(false);
  });

  it("interruptores: ligado = on, ausente = desligado", () => {
    expect(preferencesSchema.parse({ notify_arrivals: "on" })).toEqual({ notify_arrivals: true, notify_overdue: false });
    expect(preferencesSchema.parse({})).toEqual({ notify_arrivals: false, notify_overdue: false });
  });
});
