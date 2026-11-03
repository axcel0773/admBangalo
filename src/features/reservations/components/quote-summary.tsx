import { Info } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatCurrency, formatDecimal, pluralize } from "@/lib/format";

import type { StayQuote } from "../domain/pricing";
import type { ChargeMode } from "../domain/types";

const QUANTITY_LABEL: Record<ChargeMode, (quantity: number) => string> = {
  per_stay: () => "por estadia",
  per_night: (q) => pluralize(q, "noite", "noites"),
  per_guest: (q) => pluralize(q, "pessoa", "pessoas"),
  per_guest_night: (q) => `${formatDecimal(q)} pessoa×noite`,
  metered: () => "calculada no check-out",
};

interface QuoteSummaryProps {
  quote: StayQuote;
  nights: number;
  nightlyRate: number;
  discount: number;
  className?: string;
}

/** Prévia dos valores: hospedagem, taxas automáticas e total. */
export function QuoteSummary({ quote, nights, nightlyRate, discount, className }: QuoteSummaryProps) {
  const hasMetered = quote.charges.some((charge) => charge.mode === "metered");

  return (
    <div className={cn("flex flex-col", className)}>
      <dl className="divide-y divide-line text-sm">
        <div className="flex justify-between gap-4 py-2.5">
          <dt>
            <span className="font-semibold">Hospedagem</span>
            <span className="block text-xs text-ink-muted">
              {pluralize(nights, "noite", "noites")} × {formatCurrency(nightlyRate)}
              {discount > 0 ? ` − ${formatCurrency(discount)} de desconto` : ""}
            </span>
          </dt>
          <dd className="font-semibold">{formatCurrency(quote.lodging)}</dd>
        </div>
        {quote.charges.map((charge) => (
          <div key={charge.description} className="flex justify-between gap-4 py-2.5">
            <dt>
              <span className="font-semibold">{charge.description}</span>
              <span className="block text-xs text-ink-muted">
                {charge.mode === "per_stay" || charge.mode === "metered"
                  ? QUANTITY_LABEL[charge.mode](charge.quantity)
                  : `${QUANTITY_LABEL[charge.mode](charge.quantity)} × ${formatCurrency(charge.unitAmount)}`}
              </span>
            </dt>
            <dd className="font-semibold">{charge.mode === "metered" ? "—" : formatCurrency(charge.total)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-1 flex items-baseline justify-between border-t-2 border-ink pt-3">
        <span className="font-display text-lg font-semibold">Total previsto</span>
        <span className="font-display text-2xl font-semibold">{formatCurrency(quote.total)}</span>
      </div>
      {hasMetered ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-energy-soft px-3 py-2.5 text-xs text-energy-ink">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          A energia entra no total quando você lançar a leitura do medidor no check-out.
        </p>
      ) : null}
    </div>
  );
}
