import { CardSection } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatPercent, pluralize } from "@/lib/format";

import type { ChaletMonthRow } from "../domain";

/** Receita, noites e ocupação de cada bangalô no mês. */
export function ChaletBreakdown({ rows }: { rows: ChaletMonthRow[] }) {
  if (rows.length === 0) return null;

  return (
    <CardSection title="Por bangalô" titleId="finance-chalets">
      <ul className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.name} className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-semibold">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
                <span className="truncate">{row.name}</span>
              </span>
              <Money value={row.revenue} className="font-semibold" />
            </span>
            <ProgressBar value={row.occupancy} label={`Ocupação de ${row.name}`} />
            <span className="text-xs text-ink-muted">
              {formatPercent(row.occupancy)} ocupado · {pluralize(row.nights, "noite", "noites")} ·{" "}
              {pluralize(row.reservations, "entrada", "entradas")}
            </span>
          </li>
        ))}
      </ul>
    </CardSection>
  );
}
