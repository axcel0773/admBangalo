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

// ---- Páginas do app (atalhos "Ir para") ----------------------------------------

export interface SearchPage {
  label: string;
  description: string;
  href: string;
  /** Outras palavras que levam à página (sem acento, minúsculas). */
  keywords?: string[];
}

/** Sem acento e em minúsculas: "Hóspedes" e "hospedes" se encontram. */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Páginas cujo nome (ou palavra-chave) começa com o que foi digitado. */
export function matchPages(pages: SearchPage[], raw: string): SearchPage[] {
  const term = foldText(raw.trim());
  if (term.length < SEARCH_MIN_LENGTH) return [];
  return pages.filter((page) => [page.label, ...(page.keywords ?? [])].some((word) => foldText(word).startsWith(term)));
}

/**
 * Palavra que completa o que a pessoa digitou ("ho" → "Hóspedes"), ou null.
 * Só completa pelo nome da página, e só quando o texto digitado é o começo dele.
 */
export function completionFor(pages: SearchPage[], raw: string): string | null {
  const term = foldText(raw);
  if (term.trim().length < SEARCH_MIN_LENGTH || term !== term.trimStart()) return null;
  const page = pages.find((item) => foldText(item.label).startsWith(term) && item.label.length > raw.length);
  return page?.label ?? null;
}
