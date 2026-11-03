import "server-only";

import { addDays, daysInMonth, startOfMonth, todayIso } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createDashboardRepository, type DashboardRepository } from "../data/dashboard.repository";
import { buildDashboard } from "../domain/build-dashboard";
import type { DashboardData } from "../domain/types";

const UPCOMING_LIMIT = 5;

/**
 * Caso de uso do Painel: busca em paralelo e delega o cálculo ao domínio.
 * O repository pode ser injetado (útil em testes).
 */
export async function getDashboard(
  options: { now?: Date; repository?: DashboardRepository } = {},
): Promise<DashboardData> {
  const repository =
    options.repository ?? createDashboardRepository(await createSupabaseServerClient());

  const today = todayIso(options.now);
  const monthStart = startOfMonth(today);
  const monthEnd = addDays(monthStart, daysInMonth(today) - 1);

  const [chalets, monthStays, openBalances, monthPayments, upcoming] = await Promise.all([
    repository.listActiveChalets(),
    repository.listStaysBetween(monthStart, monthEnd),
    repository.listOpenBalances(),
    repository.listPaymentsBetween(monthStart, monthEnd),
    repository.listUpcomingArrivals(today, UPCOMING_LIMIT),
  ]);

  return buildDashboard({ today, chalets, monthStays, openBalances, monthPayments, upcoming });
}
