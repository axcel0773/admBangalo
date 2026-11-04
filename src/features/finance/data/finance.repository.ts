import "server-only";

import type { IsoDate } from "@/lib/dates";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { CashPayment, ChaletRef, FinanceStay, MonthSummaryRow } from "../domain";

const STAY_COLUMNS =
  "reservation_id, chalet_name, main_guest_name, check_in, check_out, nights, guests_count, status, lodging_total, charges_total, energy_total, cleaning_total, grand_total, paid_total, balance_due, payment_status";

/** Consultas do Financeiro. O RLS limita tudo ao proprietário logado. */
export function createFinanceRepository(db: DbClient) {
  return {
    /** Estadias (não canceladas) que tocam o período [from, to]. */
    async listStaysTouching(from: IsoDate, to: IsoDate): Promise<FinanceStay[]> {
      const result = await db
        .from("reservation_financials")
        .select(STAY_COLUMNS)
        .neq("status", "cancelled")
        .lte("check_in", to)
        .gt("check_out", from)
        .order("check_in");
      return unwrapList(result, "Listar estadias do mês");
    },

    async listPaymentsBetween(from: IsoDate, to: IsoDate): Promise<CashPayment[]> {
      const result = await db
        .from("payments")
        .select("amount, kind, method, paid_at")
        .gte("paid_at", from)
        .lte("paid_at", to);
      return unwrapList(result, "Listar pagamentos do mês");
    },

    async listMonthlySummary(from: IsoDate, to: IsoDate): Promise<MonthSummaryRow[]> {
      const result = await db
        .from("monthly_summary")
        .select("month, revenue_expected, revenue_received")
        .gte("month", from)
        .lte("month", to)
        .order("month");
      return unwrapList(result, "Resumo mensal");
    },

    async listActiveChalets(): Promise<ChaletRef[]> {
      const result = await db.from("chalets").select("name, color").eq("active", true).order("name");
      return unwrapList(result, "Listar chalés");
    },
  };
}
