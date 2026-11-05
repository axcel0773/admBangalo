import { ArrowRight, PiggyBank, Receipt } from "lucide-react";
import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { Money } from "@/components/ui/money";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/cn";
import { formatCurrencyRounded } from "@/lib/format";

import type { MonthReport } from "../domain";

/** Despesas e lucro de caixa do mês (recebido − despesas); leva à lista de despesas. */
export function ProfitSummary({ report }: { report: MonthReport }) {
  const negative = report.profit < 0;
  return (
    <section aria-label="Despesas e lucro do mês" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatCard
        label="Despesas"
        icon={<Receipt />}
        iconTone="accent"
        value={<Money value={report.expenses} rounded tone="pending" />}
        footer={
          <Link href={routes.expenses} className="inline-flex items-center gap-1 font-semibold text-primary-ink">
            Ver e lançar <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        }
      />
      <StatCard
        label="Lucro do mês (caixa)"
        icon={<PiggyBank />}
        value={
          <span className={cn("tabular-nums", negative ? "text-danger-ink" : "text-primary-ink")}>
            {formatCurrencyRounded(report.profit)}
          </span>
        }
        footer={`${formatCurrencyRounded(report.cashIn)} que entraram − despesas`}
      />
    </section>
  );
}
