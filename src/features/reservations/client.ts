// Entrada da feature para componentes do navegador ("use client"): só cálculo puro e componentes,
// sem nada que dependa do servidor (o index.ts inclui services com "server-only").
export { StayStep } from "./components/new-reservation/stay-step";
export { QuoteSummary } from "./components/quote-summary";
export { nightsOf, quoteDraft, validateDraft, type FeeForQuote } from "./domain/quote";
export { nightlyBreakdown, type SeasonRate } from "./domain/seasons";
