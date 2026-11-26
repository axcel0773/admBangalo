import { CircleCheck, Clock3, House, Landmark, TrendingDown, TrendingUp } from "lucide-react";

import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { formatPercent, pluralize } from "@/lib/format";

import { cn } from "@/lib/cn";

import { compareWithPrevious, formatMonthName, type MonthReport } from "../domain";
import { MoneyBlockHeading } from "./money-block-heading";

/** "▲ 12% vs mês anterior"; some quando os dois meses estão zerados. */
function VsPrevious({ current, previous }: { current: number; previous: number }) {
  if (current === 0 && previous === 0) return null;
  const change = compareWithPrevious(current, previous);
  if (change.direction === "same") return <p>igual ao mês anterior</p>;
  const Icon = change.direction === "up" ? TrendingUp : TrendingDown;
  return (
    <p
      className={cn(
        "flex items-center gap-1 font-semibold",
        change.direction === "up" ? "text-primary-ink" : "text-danger-ink",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {change.ratio === null ? "mês anterior sem receita" : `${formatPercent(change.ratio)} vs mês anterior`}
    </p>
  );
}

interface FinanceSummaryProps {
  report: MonthReport;
  /** Valores do mês anterior, para comparar. */
  previous?: { expected: number; received: number } | null;
}

/**
 * "Reservas de novembro": as estadias que começam no mês, quanto valem, quanto já foi pago
 * (em qualquer data) e quanto falta. Celular: 2 colunas, dinheiro primeiro.
 */
export function FinanceSummary({ report, previous }: FinanceSummaryProps) {
  const month = formatMonthName(report.month);
  return (
    <section aria-labelledby="finance-stays" className="flex flex-col gap-3">
      <MoneyBlockHeading id="finance-stays" title={`Reservas de ${month}`}>
        {`Hóspedes que chegam em ${month}: quanto valem, quanto já pagaram (em qualquer data) e quanto falta.`}
      </MoneyBlockHeading>
      <div className="stagger grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatCard
        label="Total das reservas"
        icon={<Landmark />}
        iconTone="neutral"
        value={<Money value={report.expected} rounded />}
        footer={
          <>
            <p>{pluralize(report.stays.length, "reserva", "reservas")}</p>
            {previous ? <VsPrevious current={report.expected} previous={previous.expected} /> : null}
          </>
        }
      />
      <StatCard
        label="Já pago"
        icon={<CircleCheck />}
        value={<Money value={report.received} rounded tone="positive" />}
        footer={
          <>
            <p>{report.expected > 0 ? `${formatPercent(report.received / report.expected)} do total` : "sem reservas"}</p>
            {previous ? <VsPrevious current={report.received} previous={previous.received} /> : null}
          </>
        }
      >
        <ProgressBar value={report.expected > 0 ? report.received / report.expected : 0} label="Já pago do total" />
      </StatCard>
      <StatCard
        label="Falta receber"
        icon={<Clock3 />}
        iconTone="accent"
        value={<Money value={report.pending} rounded tone="pending" />}
        footer="destas reservas"
      />
      <StatCard
        label="Ocupação"
        icon={<House />}
        value={formatPercent(report.occupancy)}
        footer={pluralize(report.nightsSold, "noite ocupada", "noites ocupadas")}
      >
        <ProgressBar value={report.occupancy} label="Ocupação no mês" />
      </StatCard>
      </div>
    </section>
  );
}
