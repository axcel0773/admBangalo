import "server-only";

import { assertMutation } from "@/lib/supabase/errors";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { DigestInput } from "../domain";
import type { SubscriptionInput } from "../schemas";
import type { PushSubscriptionKeys } from "../web-push";

export interface NotificationPreferences {
  notifyArrivals: boolean;
  notifyOverdue: boolean;
}

export interface DigestTarget extends PushSubscriptionKeys {
  digest: DigestInput;
}

export function createNotificationsRepository(db: DbClient) {
  return {
    async saveSubscription(input: SubscriptionInput): Promise<void> {
      assertMutation(
        await db
          .from("push_subscriptions")
          .upsert({ endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth }, { onConflict: "endpoint" }),
        "Não foi possível ativar as notificações.",
      );
    },

    async removeSubscription(endpoint: string): Promise<void> {
      assertMutation(
        await db.from("push_subscriptions").delete().eq("endpoint", endpoint),
        "Não foi possível desativar as notificações.",
      );
    },

    async listMySubscriptions(): Promise<PushSubscriptionKeys[]> {
      return unwrapList(await db.from("push_subscriptions").select("endpoint, p256dh, auth"), "Listar aparelhos");
    },

    async getPreferences(): Promise<NotificationPreferences> {
      const { data } = await db.from("profiles").select("notify_arrivals, notify_overdue").maybeSingle();
      return { notifyArrivals: data?.notify_arrivals ?? true, notifyOverdue: data?.notify_overdue ?? true };
    },

    async updatePreferences(input: { notify_arrivals: boolean; notify_overdue: boolean }): Promise<void> {
      const { data: auth } = await db.auth.getUser();
      if (!auth.user) return;
      assertMutation(
        await db.from("profiles").update(input).eq("id", auth.user.id),
        "Não foi possível salvar as preferências.",
      );
    },

    /** Cron: quem deve receber o aviso de hoje (exige o segredo, conferido no banco). */
    async digestTargets(secret: string, today: string): Promise<DigestTarget[]> {
      const rows = unwrapList(await db.rpc("push_digest", { p_secret: secret, p_today: today }), "Montar avisos do dia");
      return rows.map((row) => ({
        endpoint: row.endpoint,
        p256dh: row.p256dh,
        auth: row.auth,
        digest: {
          arrivals: row.arrivals,
          departures: row.departures,
          overdueCount: row.overdue_count,
          overdueAmount: Number(row.overdue_amount),
        },
      }));
    },

    async forgetSubscription(secret: string, endpoint: string): Promise<void> {
      await db.rpc("push_forget", { p_secret: secret, p_endpoint: endpoint });
    },
  };
}
