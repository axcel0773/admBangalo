import "server-only";

import type { IsoDate } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createCommissionsRepository, type CommissionRow } from "./data/commissions.repository";
import { uniqueBrokerNames } from "./domain";

export type { CommissionRow };

export async function commissionsRepository() {
  return createCommissionsRepository(await createSupabaseServerClient());
}

/** Corretores já usados, para sugerir no campo de nome. */
export async function listBrokerNames(): Promise<string[]> {
  return uniqueBrokerNames(await (await commissionsRepository()).listBrokerNames());
}

/** Comissões pagas entre `from` e `to` (entram nas despesas do mês). */
export async function listPaidCommissions(from: IsoDate, to: IsoDate): Promise<CommissionRow[]> {
  return (await commissionsRepository()).listPaidBetween(from, to);
}

/** Comissões ainda a pagar, de qualquer mês. */
export async function listPendingCommissions(): Promise<CommissionRow[]> {
  return (await commissionsRepository()).listPending();
}
