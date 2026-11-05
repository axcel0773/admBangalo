import type { IsoDate } from "@/lib/dates";
import type { Tables } from "@/types/database";

export type QuoteStatus = Tables<"quotes">["status"];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  accepted: "Aceito",
  declined: "Recusado",
};

export function isQuoteStatus(value: string): value is QuoteStatus {
  return Object.hasOwn(QUOTE_STATUS_LABELS, value);
}

/** O que o hóspede e o dono veem: "Vencido" é derivado da validade e só vale para orçamentos ainda em aberto. */
export type QuoteDisplayStatus = QuoteStatus | "expired";

export function displayStatus(quote: { status: QuoteStatus; valid_until: IsoDate }, today: IsoDate): QuoteDisplayStatus {
  const open = quote.status === "draft" || quote.status === "sent";
  return open && quote.valid_until < today ? "expired" : quote.status;
}

export const QUOTE_DISPLAY_LABELS: Record<QuoteDisplayStatus, string> = { ...QUOTE_STATUS_LABELS, expired: "Vencido" };

export const QUOTE_DISPLAY_TONES = {
  draft: "neutral",
  sent: "warning",
  accepted: "success",
  declined: "danger",
  expired: "danger",
} as const satisfies Record<QuoteDisplayStatus, "neutral" | "warning" | "success" | "danger">;

/** Filtros da lista (?status=). "Em aberto" = rascunho ou enviado que ainda não venceu. */
export const QUOTE_FILTERS = {
  all: "Todos",
  open: "Em aberto",
  accepted: "Aceitos",
  declined: "Recusados",
  expired: "Vencidos",
} as const;

export type QuoteFilter = keyof typeof QUOTE_FILTERS;

export function isQuoteFilter(value: string | undefined): value is QuoteFilter {
  return value !== undefined && Object.hasOwn(QUOTE_FILTERS, value);
}

export function filterQuotes<T extends { status: QuoteStatus; valid_until: IsoDate }>(
  quotes: T[],
  filter: QuoteFilter,
  today: IsoDate,
): T[] {
  if (filter === "all") return quotes;
  return quotes.filter((quote) => {
    const shown = displayStatus(quote, today);
    if (filter === "open") return shown === "draft" || shown === "sent";
    return shown === filter;
  });
}

/** Orçamento em aberto (rascunho/enviado, dentro da validade): é o único que pode "perder" as datas. */
export function isOpenQuote(quote: { status: QuoteStatus; valid_until: IsoDate }, today: IsoDate): boolean {
  const shown = displayStatus(quote, today);
  return shown === "draft" || shown === "sent";
}

export interface StayRange {
  chalet_id: string;
  check_in: IsoDate;
  check_out: IsoDate;
}

/** As datas do orçamento batem com alguma estadia do mesmo bangalô? (check-out não ocupa a noite.) */
export function overlapsAnyStay(
  quote: { chalet_id: string; check_in: IsoDate; check_out: IsoDate },
  stays: StayRange[],
): boolean {
  return stays.some(
    (stay) => stay.chalet_id === quote.chalet_id && quote.check_in < stay.check_out && stay.check_in < quote.check_out,
  );
}
