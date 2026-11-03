import "server-only";

import type { IsoDate } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createFinanceRepository } from "./data/finance.repository";
import { buildMonthReport, buildTrend, endOfMonth, financeCsv, shiftMonth, type MonthReport, type TrendPoint } from "./domain";

const TREND_MONTHS = 6;

async function financeRepository() {
  return createFinanceRepository(await createSupabaseServerClient());
}

async function loadMonthReport(month: IsoDate): Promise<MonthReport> {
  const repo = await financeRepository();
  const last = endOfMonth(month);
  const [stays, payments, activeChalets] = await Promise.all([
    repo.listStaysTouching(month, last),
    repo.listPaymentsBetween(month, last),
    repo.countActiveChalets(),
  ]);
  return buildMonthReport({ month, stays, payments, activeChalets });
}

export async function getFinanceOverview(month: IsoDate): Promise<{ report: MonthReport; trend: TrendPoint[] }> {
  const repo = await financeRepository();
  const [report, summary] = await Promise.all([
    loadMonthReport(month),
    repo.listMonthlySummary(shiftMonth(month, -(TREND_MONTHS - 1)), month),
  ]);
  return { report, trend: buildTrend(summary, month, TREND_MONTHS) };
}

export async function getMonthCsv(month: IsoDate): Promise<string> {
  return financeCsv(await loadMonthReport(month));
}
