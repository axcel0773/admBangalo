import { CardSection } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PAYMENT_METHOD_LABELS } from "@/features/billing";

import type { MonthReport } from "../domain";

/** De onde vem a receita do mês e por onde o dinheiro entrou. */
export function RevenueBreakdown({ report }: { report: MonthReport }) {
  const parts = [
    { label: "Hospedagem", value: report.lodging, bar: "bg-primary" },
    { label: "Limpeza", value: report.cleaning, bar: "bg-chalet-slate" },
    { label: "Energia", value: report.energy, bar: "bg-energy-ink" },
    { label: "Outras taxas", value: report.otherCharges, bar: "bg-accent" },
  ];
  const methods = Object.entries(report.cashByMethod).filter(([, value]) => value !== 0);

  return (
    <CardSection title="Composição" titleId="finance-breakdown">
      <ul className="flex flex-col gap-3">
        {parts.map((part) => (
          <li key={part.label} className="flex flex-col gap-1.5">
            <span className="flex justify-between text-sm">
              <span className="font-semibold">{part.label}</span>
              <Money value={part.value} />
            </span>
            <ProgressBar
              value={report.expected > 0 ? part.value / report.expected : 0}
              label={`${part.label} no previsto`}
              barClassName={part.bar}
            />
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-line pt-4">
        <p className="flex justify-between text-sm">
          <span className="font-semibold">Entrou no caixa</span>
          <Money value={report.cashIn} tone="positive" className="font-bold" />
        </p>
        <p className="mb-2 text-xs text-ink-muted">Pagamentos com data neste mês, de qualquer reserva, menos estornos.</p>
        {methods.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {methods.map(([method, value]) => (
              <li key={method} className="rounded-full bg-canvas px-3 py-1 text-xs">
                {PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]} ·{" "}
                <Money value={value} className="font-semibold" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </CardSection>
  );
}
