const LOCALE = "pt-BR";

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "BRL" });
const compactCurrencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

/** R$ 1.460,28 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** R$ 1.460 — para cartões onde o centavo só polui. */
export function formatCurrencyRounded(value: number): string {
  return compactCurrencyFormatter.format(Math.round(value));
}

/** 0.62 → 62% */
export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio);
}

/** 84.5 → 84,5 */
export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

/** "Maria Souza" → "MS" (no máximo duas letras). */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
