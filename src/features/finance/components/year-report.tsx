import { CardSection } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatPercent, pluralize } from "@/lib/format";

import type { YearReport } from "../reports";

/** Relatório do ano: resumo, mês a mês, origem das reservas e bangalôs. */
export function YearReportView({ report }: { report: YearReport }) {
  const { totals } = report;
  return (
    <>
      <CardSection title={`Resumo de ${report.year}`} titleId="report-summary">
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div>
            <dt className="text-xs text-ink-muted">Ocupação</dt>
            <dd className="font-display text-xl font-semibold">{formatPercent(totals.occupancy)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Diária média</dt>
            <dd className="font-display text-xl font-semibold">
              <Money value={totals.averageRate} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Hospedagem</dt>
            <dd className="font-display text-xl font-semibold">
              <Money value={totals.revenue} />
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-center text-xs text-ink-muted">
          {pluralize(totals.nightsSold, "noite vendida", "noites vendidas")} de {totals.nightsAvailable.toLocaleString("pt-BR")} disponíveis
        </p>
      </CardSection>

      <CardSection title="Mês a mês" titleId="report-months">
        <ul className="divide-y divide-line">
          {report.months.map((row) => (
            <li key={row.month} className="flex flex-col gap-1.5 py-3">
              <span className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold capitalize">{row.label}</span>
                <Money value={row.revenue} className="font-semibold" />
              </span>
              <ProgressBar value={row.occupancy} label={`Ocupação em ${row.label}`} />
              <span className="text-xs text-ink-muted">
                {formatPercent(row.occupancy)} ocupado · {pluralize(row.nightsSold, "noite", "noites")}
                {row.nightsSold > 0 ? " · diária média " : ""}
                {row.nightsSold > 0 ? <Money value={row.averageRate} /> : null}
              </span>
            </li>
          ))}
        </ul>
      </CardSection>

      {report.sources.length > 0 ? (
        <CardSection title="De onde vêm as reservas" titleId="report-sources">
          <ul className="divide-y divide-line">
            {report.sources.map((row) => (
              <li key={row.source} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  <span className="font-semibold">{row.label}</span>
                  <span className="text-ink-muted"> · {pluralize(row.reservations, "reserva", "reservas")}</span>
                </span>
                <Money value={row.revenue} className="font-semibold" />
              </li>
            ))}
          </ul>
        </CardSection>
      ) : null}

      {report.chalets.length > 0 ? (
        <CardSection title="Por bangalô" titleId="report-chalets">
          <ul className="flex flex-col gap-4">
            {report.chalets.map((row) => (
              <li key={row.name} className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold">{row.name}</span>
                  <Money value={row.revenue} className="font-semibold" />
                </span>
                <ProgressBar value={row.occupancy} label={`Ocupação de ${row.name} no ano`} />
                <span className="text-xs text-ink-muted">
                  {formatPercent(row.occupancy)} do ano · {pluralize(row.nightsSold, "noite", "noites")}
                </span>
              </li>
            ))}
          </ul>
        </CardSection>
      ) : null}
    </>
  );
}
