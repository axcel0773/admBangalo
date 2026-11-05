"use server";

import { getCurrentOwner } from "@/features/auth/session";

import { normalizeSearchTerm, type SearchResults } from "./domain";
import { searchAll } from "./services";

const EMPTY = (term: string): SearchResults => ({ term, guests: [], reservations: [], quotes: [] });

/** Resultados enquanto a pessoa digita (chamada com atraso curto pelo campo de busca). */
export async function searchSuggest(raw: string): Promise<SearchResults> {
  const term = normalizeSearchTerm(raw);
  if (!term) return EMPTY(raw.trim());
  if (!(await getCurrentOwner())) return EMPTY(term);
  return searchAll(term);
}
