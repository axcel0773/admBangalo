import "server-only";

import { endOfMonth } from "@/features/finance/domain";
import type { IsoDate } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createExpensesRepository } from "./data/expenses.repository";
import type { Expense } from "./domain";

export async function expensesRepository() {
  return createExpensesRepository(await createSupabaseServerClient());
}

/** Despesas do mês de `month` (primeiro dia do mês). */
export async function listMonthExpenses(month: IsoDate): Promise<Expense[]> {
  return (await expensesRepository()).listBetween(month, endOfMonth(month));
}
