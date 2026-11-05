import "server-only";

import { listChalets } from "@/features/chalets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { todayIso } from "@/lib/dates";

import { createQuotesRepository, type Quote } from "./data/quotes.repository";
import { isOpenQuote, overlapsAnyStay, type QuoteStatus } from "./domain/status";

export async function quotesRepository() {
  return createQuotesRepository(await createSupabaseServerClient());
}

export interface QuoteListItem extends Quote {
  chaletName: string;
  /** Orçamento em aberto cujas datas já foram ocupadas por uma reserva. */
  datesTaken: boolean;
}

/** Orçamentos do mais novo para o mais antigo, com o nome do bangalô. */
export async function listQuotes(): Promise<QuoteListItem[]> {
  const [quotes, chalets] = await Promise.all([(await quotesRepository()).list(), listChalets()]);
  const names = new Map(chalets.map((chalet) => [chalet.id, chalet.name]));
  const today = todayIso();

  // Uma única consulta de estadias cobre todos os orçamentos em aberto.
  const open = quotes.filter((quote) => isOpenQuote(quote, today));
  const stays =
    open.length > 0
      ? await (await quotesRepository()).listStaysTouching(
          open.map((quote) => quote.check_in).sort()[0] as string,
          open.map((quote) => quote.check_out).sort().at(-1) as string,
        )
      : [];

  return quotes.map((quote) => ({
    ...quote,
    chaletName: names.get(quote.chalet_id) ?? "Bangalô removido",
    datesTaken: isOpenQuote(quote, today) && overlapsAnyStay(quote, stays),
  }));
}

/** As datas deste orçamento em aberto já foram ocupadas por uma reserva? */
export async function quoteDatesTaken(quote: Quote): Promise<boolean> {
  if (!isOpenQuote(quote, todayIso())) return false;
  const stays = await (await quotesRepository()).listStaysTouching(quote.check_in, quote.check_out);
  return overlapsAnyStay(quote, stays);
}

/** Marca como aceito (usado quando a reserva nasce de um orçamento). Silencioso: não pode derrubar a criação da reserva. */
export async function markQuoteAccepted(id: string): Promise<void> {
  try {
    await (await quotesRepository()).setStatus(id, "accepted" satisfies QuoteStatus);
  } catch {
    // orçamento removido ou sem permissão: a reserva já foi criada, então seguimos
  }
}

export async function getQuote(id: string): Promise<Quote | null> {
  return (await quotesRepository()).findById(id);
}

export type { Quote };
