import "server-only";

import { listChalets } from "@/features/chalets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createQuotesRepository, type Quote } from "./data/quotes.repository";

export async function quotesRepository() {
  return createQuotesRepository(await createSupabaseServerClient());
}

export interface QuoteListItem extends Quote {
  chaletName: string;
}

/** Orçamentos do mais novo para o mais antigo, com o nome do chalé. */
export async function listQuotes(): Promise<QuoteListItem[]> {
  const [quotes, chalets] = await Promise.all([(await quotesRepository()).list(), listChalets()]);
  const names = new Map(chalets.map((chalet) => [chalet.id, chalet.name]));
  return quotes.map((quote) => ({ ...quote, chaletName: names.get(quote.chalet_id) ?? "Chalé removido" }));
}

export async function getQuote(id: string): Promise<Quote | null> {
  return (await quotesRepository()).findById(id);
}

export type { Quote };
