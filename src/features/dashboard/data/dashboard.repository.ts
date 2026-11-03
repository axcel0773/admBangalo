import "server-only";

import type { IsoDate } from "@/lib/dates";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { ChaletRow, PaymentRow, ScheduleRow, StayRow } from "../domain/types";

/**
 * Acesso a dados do Painel. Só consultas — nenhuma regra de negócio.
 * O RLS garante que cada proprietário recebe apenas as próprias linhas.
 */
export function createDashboardRepository(db: DbClient) {
  return {
    async listActiveChalets(): Promise<ChaletRow[]> {
      const result = await db
        .from("chalets")
        .select("id, name, color, max_guests, base_nightly_rate, check_in_time, check_out_time")
        .eq("active", true)
        .order("name");
      return unwrapList(result, "Listar chalés");
    },

    /** Estadias que tocam o período [from, to] (inclusive). */
    async listStaysBetween(from: IsoDate, to: IsoDate): Promise<StayRow[]> {
      const result = await db
        .from("reservation_financials")
        .select(
          "reservation_id, chalet_id, chalet_name, main_guest_name, check_in, check_out, nights, guests_count, status, grand_total, paid_total, balance_due, payment_status",
        )
        .neq("status", "cancelled")
        .lte("check_in", to)
        .gte("check_out", from)
        .order("check_in");
      return unwrapList(result, "Listar estadias do período");
    },

    /** Todas as reservas com saldo (o total do Painel soma todas). */
    async listOpenBalances(): Promise<StayRow[]> {
      const result = await db
        .from("reservation_financials")
        .select(
          "reservation_id, chalet_id, chalet_name, main_guest_name, check_in, check_out, nights, guests_count, status, grand_total, paid_total, balance_due, payment_status",
        )
        .neq("status", "cancelled")
        .gt("balance_due", 0)
        .order("check_in");
      return unwrapList(result, "Listar saldos em aberto");
    },

    async listPaymentsBetween(from: IsoDate, to: IsoDate): Promise<PaymentRow[]> {
      const result = await db
        .from("payments")
        .select("amount, kind, method")
        .gte("paid_at", from)
        .lte("paid_at", to);
      return unwrapList(result, "Listar pagamentos do período");
    },

    async listUpcomingArrivals(after: IsoDate, limit: number): Promise<StayRow[]> {
      const result = await db
        .from("reservation_financials")
        .select(
          "reservation_id, chalet_id, chalet_name, main_guest_name, check_in, check_out, nights, guests_count, status, grand_total, paid_total, balance_due, payment_status",
        )
        .in("status", ["pending", "confirmed"])
        .gt("check_in", after)
        .order("check_in")
        .limit(limit);
      return unwrapList(result, "Listar próximas chegadas");
    },

    /** Parcelas previstas das reservas com saldo (para o vencimento do "A receber"). */
    async listSchedulesFor(reservationIds: string[]): Promise<ScheduleRow[]> {
      if (reservationIds.length === 0) return [];
      const result = await db
        .from("payment_schedule")
        .select("id, reservation_id, description, amount, due_date")
        .in("reservation_id", reservationIds);
      return unwrapList(result, "Listar parcelas");
    },
  };
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;
