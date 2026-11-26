import { ArrowRight, CircleCheck, PiggyBank, Receipt } from "lucide-react";
import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { Money } from "@/components/ui/money";
import { StatCard } from "@/components/ui/stat-card";

import { formatMonthName, type MonthReport } from "../domain";
import { MoneyBlockHeading } from "./money-block-heading";

/**
 * "Dinheiro de novembro": o que entrou no mês (pela data do pagamento), as despesas e o que sobrou.
 * Não depende de quando o hóspede chega: é o dinheiro que passou pela mão no mês.
 */
export function ProfitSummary({ report }: { report: MonthReport }) {
  const negative = report.profit < 0;
  const month = formatMonthName(report.month);
  return (
    <section aria-labelledby="finance-cash" className="flex flex-col gap-3">
      <MoneyBlockHeading id="finance-cash" title={`Dinheiro de ${month}`}>
        {`Pagamentos recebidos em ${month}, de qualquer reserva, menos as despesas.`}
      </MoneyBlockHeading>
      <div className="stagger grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        <StatCard
          label="Entrou"
          icon={<CircleCheck />}
          value={<Money value={report.cashIn} rounded tone="positive" />}
          footer="pagamentos do mês"
        />
        <StatCard
          label="Despesas"
          icon={<Receipt />}
          iconTone="accent"
          value={<Money value={report.expenses} rounded tone="pending" />}
          footer={
            <Link href={routes.expenses} className="-my-2.5 inline-flex min-h-10 items-center gap-1 font-semibold text-primary-ink">
              Ver e lançar <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          }
        />
        <StatCard
          className="col-span-2 lg:col-span-1"
          label={negative ? "Faltou" : "Sobrou"}
          icon={<PiggyBank />}
          value={
            <Money value={Math.abs(report.profit)} rounded className={negative ? "text-danger-ink" : "text-primary-ink"} />
          }
          footer={negative ? "as despesas passaram do que entrou" : "o que entrou menos as despesas"}
        />
      </div>
    </section>
  );
}
