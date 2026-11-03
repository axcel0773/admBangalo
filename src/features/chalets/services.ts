import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { SeasonRate } from "@/features/reservations/domain/seasons";
import { todayIso } from "@/lib/dates";

import { createChaletsRepository } from "./data/chalets.repository";
import { createSeasonRatesRepository } from "./data/season-rates.repository";
import type { Chalet } from "./domain";

async function repository() {
  return createChaletsRepository(await createSupabaseServerClient());
}

export async function listChalets(options: { onlyActive?: boolean } = {}): Promise<Chalet[]> {
  return (await repository()).list(options);
}

export async function getChalet(id: string): Promise<Chalet | null> {
  return (await repository()).findById(id);
}

export async function seasonRatesRepository() {
  return createSeasonRatesRepository(await createSupabaseServerClient());
}

export async function listSeasonRates(chaletId: string): Promise<SeasonRate[]> {
  return (await seasonRatesRepository()).listByChalet(chaletId);
}

/** Temporadas de todos os chalés que ainda não terminaram. */
export async function listCurrentSeasonRates(): Promise<SeasonRate[]> {
  return (await seasonRatesRepository()).listCurrent(todayIso());
}

export { repository as chaletsRepository };
