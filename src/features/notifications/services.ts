import "server-only";

import { todayIso } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { vapidFromEnv } from "./config";
import { createNotificationsRepository } from "./data/notifications.repository";
import { buildDigest, TEST_MESSAGE } from "./domain";
import { sendPush } from "./web-push";

export async function notificationsRepository() {
  return createNotificationsRepository(await createSupabaseServerClient());
}

export interface NotificationSettings {
  /** false quando as chaves VAPID não foram configuradas no servidor. */
  configured: boolean;
  publicKey: string | null;
  notifyArrivals: boolean;
  notifyOverdue: boolean;
  devices: number;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const vapid = vapidFromEnv();
  const repository = await notificationsRepository();
  const [preferences, devices] = await Promise.all([repository.getPreferences(), repository.listMySubscriptions()]);
  return {
    configured: vapid !== null,
    publicKey: vapid?.publicKey ?? null,
    notifyArrivals: preferences.notifyArrivals,
    notifyOverdue: preferences.notifyOverdue,
    devices: devices.length,
  };
}

/** Manda uma notificação de teste para os aparelhos do dono logado. Devolve quantos receberam. */
export async function sendTestNotification(): Promise<number> {
  const vapid = vapidFromEnv();
  if (!vapid) return 0;
  const repository = await notificationsRepository();
  let sent = 0;
  for (const subscription of await repository.listMySubscriptions()) {
    const result = await sendPush(subscription, TEST_MESSAGE, vapid);
    if (result === "sent") sent += 1;
    if (result === "gone") await repository.removeSubscription(subscription.endpoint);
  }
  return sent;
}

export interface DigestRun {
  sent: number;
  skipped: number;
  removed: number;
  failed: number;
}

/** Cron diário: envia o aviso do dia a cada aparelho inscrito. Uma mensagem por aparelho, no máximo. */
export async function runDailyDigest(secret: string): Promise<DigestRun | null> {
  const vapid = vapidFromEnv();
  if (!vapid) return null;

  const repository = await notificationsRepository();
  const run: DigestRun = { sent: 0, skipped: 0, removed: 0, failed: 0 };
  for (const target of await repository.digestTargets(secret, todayIso())) {
    const digest = buildDigest(target.digest);
    if (!digest) {
      run.skipped += 1;
      continue;
    }
    const result = await sendPush(target, digest, vapid).catch(() => "failed" as const);
    if (result === "sent") run.sent += 1;
    else if (result === "gone") {
      await repository.forgetSubscription(secret, target.endpoint);
      run.removed += 1;
    } else run.failed += 1;
  }
  return run;
}
