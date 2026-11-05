// API pública da feature (para Server Components).
export { createQuote } from "./actions";
export { DeleteQuoteCard } from "./components/delete-quote-card";
export { NewQuoteForm } from "./components/new-quote-form";
export { QuoteDocumentCard } from "./components/quote-document-card";
export { QuoteList } from "./components/quote-list";
export { QuoteShare } from "./components/quote-share";
export { buildQuoteDocument, quoteMessage } from "./domain/quote-document";
export { getQuote, listQuotes } from "./services";
