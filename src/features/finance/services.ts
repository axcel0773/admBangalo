import "server-only";

import type { IsoDate } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createFinanceRepository } from "./data/finance.repository";
import {
  buildChaletBreakdown,
  buildMonthReport,
  buildTrend,
  endOfMonth,
  financeCsv,
  shiftMonth,
  type ChaletMonthRow,
  type MonthReport,
  type TrendPoint,
} from "./domain";
import { buildYearReport, yearReportCsv, type YearReport } from "./reports";

const TREND_MONTHS = 6;

async function financeRepository() {
  return createFinanceRepository(await createSupabaseServerClient());
}

async function loadMonth(month: IsoDate): Promise<{ report: MonthReport; chalets: ChaletMonthRow[] }> {
  const repo = await financeRepository();
  const last = endOfMonth(month);
  const [stays, payments, chalets, expenseRows] = await Promise.all([
    repo.listStaysTouching(month, last),
    repo.listPaymentsBetween(month, last),
    repo.listActiveChalets(),
    repo.listExpenseAmounts(month, last),
  ]);
  const expenses = expenseRows.reduce((total, row) => total + row.amount, 0);
  return {
    report: buildMonthReport({ month, stays, payments, activeChalets: chalets.length, expenses }),
    chalets: buildChaletBreakdown({ month, stays, chalets }),
  };
}

export async function getFinanceOverview(
  month: IsoDate,
): Promise<{ report: MonthReport; chalets: ChaletMonthRow[]; trend: TrendPoint[] }> {
  const repo = await financeRepository();
  const [{ report, chalets }, summary] = await Promise.all([
    loadMonth(month),
    repo.listMonthlySummary(shiftMonth(month, -(TREND_MONTHS - 1)), month),
  ]);
  return { report, chalets, trend: buildTrend(summary, month, TREND_MONTHS) };
}

export async function getMonthCsv(month: IsoDate): Promise<string> {
  return financeCsv((await loadMonth(month)).report);
}

export async function getYearReport(year: number): Promise<YearReport> {
  const repo = await financeRepository();
  const [stays, chalets] = await Promise.all([
    repo.listYearStays(`${year}-01-01`, `${year}-12-31`),
    repo.listActiveChalets(),
  ]);
  return buildYearReport({ year, stays, chaletNames: chalets.map((chalet) => chalet.name) });
}

export async function getYearReportCsv(year: number): Promise<string> {
  return yearReportCsv(await getYearReport(year));
}
