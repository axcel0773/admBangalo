/** Busca global: mínimo de letras e limite por grupo (a lista é um atalho, não um relatório). */
export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_LIMIT = 8;

/** Termo da URL: tira espaços e rejeita buscas curtas demais. */
export function normalizeSearchTerm(raw: string | undefined): string | null {
  const term = (raw ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  return term.length >= SEARCH_MIN_LENGTH ? term : null;
}

export interface SearchGuestHit {
  id: string;
  name: string;
  phone: string | null;
}

export interface SearchReservationHit {
  id: string;
  guestName: string;
  chaletName: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export interface SearchQuoteHit {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
}

export interface SearchResults {
  term: string;
  guests: SearchGuestHit[];
  reservations: SearchReservationHit[];
  quotes: SearchQuoteHit[];
}

export const searchTotal = (results: SearchResults) =>
  results.guests.length + results.reservations.length + results.quotes.length;
