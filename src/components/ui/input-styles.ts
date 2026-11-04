/**
 * Estilo base dos campos (input, select) — compartilhado por Server e Client Components.
 * No celular a fonte é 16px: abaixo disso o Safari do iPhone dá zoom ao tocar no campo.
 * Data/hora alinhadas à esquerda (o iOS centraliza e estoura a largura).
 */
export const inputClassName =
  "h-12 w-full min-w-0 rounded-control border border-line-strong bg-surface px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none aria-invalid:border-danger-ink md:text-[15px] [&::-webkit-date-and-time-value]:text-left";
