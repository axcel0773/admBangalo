import { CardSection } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatCurrency, formatCurrencyRounded } from "@/lib/format";

import type { TrendPoint } from "../domain";

/** Previsto × recebido dos últimos meses. Barras em CSS; a tabela fica para leitores de tela. */
export function RevenueChart({ points, currentMonth }: { points: TrendPoint[]; currentMonth: string }) {
  const max = Math.max(...points.map((point) => Math.max(point.expected, point.received)), 1);
  const height = (value: number) => `${Math.max((value / max) * 100, value > 0 ? 2 : 0)}%`;

  return (
    <CardSection
      title="Últimos 6 meses"
      titleId="finance-trend"
      action={
        <div className="flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-muted" /> Previsto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" /> Recebido
          </span>
        </div>
      }
    >
      <div aria-hidden="true" className="grid h-44 grid-cols-6 items-end gap-2 border-b border-line md:h-56 md:gap-4">
        {points.map((point) => (
          <div key={point.month} className="flex h-full items-end justify-center gap-1" title={`${point.label}: previsto ${formatCurrency(point.expected)}, recebido ${formatCurrency(point.received)}`}>
            <span className="w-1/2 max-w-6 rounded-t-md bg-muted" style={{ height: height(point.expected) }} />
            <span className="w-1/2 max-w-6 rounded-t-md bg-primary" style={{ height: height(point.received) }} />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 grid grid-cols-6 gap-2 text-center text-xs md:gap-4">
        {points.map((point) => (
          <span
            key={point.month}
            className={cn("capitalize", point.month === currentMonth ? "font-bold text-ink" : "text-ink-muted")}
          >
            {point.label}
            <span className="hidden text-[11px] font-normal text-ink-muted md:block">
              {formatCurrencyRounded(point.received)}
            </span>
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Previsto e recebido por mês</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Previsto</th>
            <th scope="col">Recebido</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.month}>
              <th scope="row">{point.label}</th>
              <td>{formatCurrency(point.expected)}</td>
              <td>{formatCurrency(point.received)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardSection>
  );
}
