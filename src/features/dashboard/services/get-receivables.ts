import "server-only";

import { getMyProfile } from "@/features/profile/services";
import { todayIso } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createDashboardRepository } from "../data/dashboard.repository";
import { buildReceivableDetails, receivableMessage, type ReceivableDetail } from "../domain/receivables";
import type { ScheduleRow } from "../domain/types";

export interface ReceivableEntry extends ReceivableDetail {
  /** Texto pronto para cobrar no WhatsApp. */
  message: string;
}

/** Tela "A receber": todos os saldos em aberto, com vencimento, telefone e mensagem de cobrança. */
export async function getReceivables(now?: Date): Promise<ReceivableEntry[]> {
  const repository = createDashboardRepository(await createSupabaseServerClient());
  const today = todayIso(now);

  const open = await repository.listOpenBalances();
  const ids = open.map((stay) => stay.reservation_id);
  const [scheduleRows, phones, profile] = await Promise.all([
    repository.listSchedulesFor(ids),
    repository.listGuestPhones(ids),
    getMyProfile(),
  ]);

  const schedules = new Map<string, ScheduleRow[]>();
  for (const row of scheduleRows) schedules.set(row.reservation_id, [...(schedules.get(row.reservation_id) ?? []), row]);

  const businessName = profile?.business_name || profile?.full_name || "";
  return buildReceivableDetails(open, today, schedules, phones).map((item) => ({
    ...item,
    message: receivableMessage({ item, businessName, pixKey: profile?.pix_key ?? null }),
  }));
}
