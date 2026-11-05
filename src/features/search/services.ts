import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createSearchRepository } from "./data/search.repository";
import type { SearchResults } from "./domain";

/** Procura o termo em hóspedes, reservas e orçamentos de uma vez. */
export async function searchAll(term: string): Promise<SearchResults> {
  const repo = createSearchRepository(await createSupabaseServerClient());
  const [guests, reservations, quotes] = await Promise.all([
    repo.guests(term),
    repo.reservations(term),
    repo.quotes(term),
  ]);
  return { term, guests, reservations, quotes };
}
