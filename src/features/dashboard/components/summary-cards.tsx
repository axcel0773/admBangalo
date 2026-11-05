import { CircleCheck, Clock3, House, Users } from "lucide-react";

import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { formatPercent, pluralize } from "@/lib/format";

import type { DashboardSummary } from "../domain/types";

/** Indicadores do mês. Celular: 2 colunas, os dois de dinheiro primeiro. */
export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <section aria-label="Indicadores do mês" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatCard
        label="A receber"
        icon={<Clock3 />}
        iconTone="accent"
        value={<Money value={summary.receivableTotal} rounded tone="pending" />}
        footer={
          summary.dueNowCount > 0 ? (
            <b className="text-accent-ink">{summary.dueNowCount} para cobrar agora</b>
          ) : (
            pluralize(summary.receivableCount, "reserva", "reservas")
          )
        }
      />
      <StatCard
        label="Recebido no mês"
        icon={<CircleCheck />}
        value={<Money value={summary.receivedThisMonth} rounded tone="positive" />}
        footer={`${pluralize(summary.paymentsThisMonth, "pagamento", "pagamentos")} · ${summary.pixPaymentsThisMonth} via Pix`}
      />
      <StatCard
        label="Ocupação no mês"
        icon={<House />}
        value={formatPercent(summary.occupancyRate)}
        footer={`${summary.nightsSold} de ${summary.nightsAvailable} noites`}
      >
        <ProgressBar value={summary.occupancyRate} label="Ocupação no mês" />
      </StatCard>
      <StatCard
        label="Hóspedes hoje"
        icon={<Users />}
        iconTone="neutral"
        value={summary.guestsToday}
        footer="dormindo nos bangalôs"
      />
    </section>
  );
}
