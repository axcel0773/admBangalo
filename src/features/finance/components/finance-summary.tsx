import { CircleCheck, Clock3, House, Landmark } from "lucide-react";

import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { formatPercent, pluralize } from "@/lib/format";

import type { MonthReport } from "../domain";

/** Indicadores do mês. Celular: 2 colunas, dinheiro primeiro. */
export function FinanceSummary({ report }: { report: MonthReport }) {
  return (
    <section aria-label="Indicadores do mês" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatCard
        label="Previsto"
        icon={<Landmark />}
        iconTone="neutral"
        value={<Money value={report.expected} rounded />}
        footer={pluralize(report.stays.length, "reserva no mês", "reservas no mês")}
      />
      <StatCard
        label="Recebido"
        icon={<CircleCheck />}
        value={<Money value={report.received} rounded tone="positive" />}
        footer={report.expected > 0 ? `${formatPercent(report.received / report.expected)} do previsto` : "—"}
      >
        <ProgressBar value={report.expected > 0 ? report.received / report.expected : 0} label="Recebido do previsto" />
      </StatCard>
      <StatCard
        label="A receber"
        icon={<Clock3 />}
        iconTone="accent"
        value={<Money value={report.pending} rounded tone="pending" />}
        footer="das reservas do mês"
      />
      <StatCard
        label="Ocupação"
        icon={<House />}
        value={formatPercent(report.occupancy)}
        footer={pluralize(report.nightsSold, "noite vendida", "noites vendidas")}
      >
        <ProgressBar value={report.occupancy} label="Ocupação no mês" />
      </StatCard>
    </section>
  );
}
