import { Download } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  FinanceSummary,
  getFinanceOverview,
  MonthNav,
  monthParam,
  MonthReservations,
  parseMonthParam,
  RevenueBreakdown,
  RevenueChart,
} from "@/features/finance";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Financeiro" };

interface FinancePageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const { mes } = await searchParams;
  const month = parseMonthParam(mes, todayIso());
  const { report, trend } = await getFinanceOverview(month);

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Receita pelo mês de entrada do hóspede; caixa pela data do pagamento."
        actions={
          // <a> comum: é um download, não uma navegação do Next.
          <a
            href={`${routes.finance}/exportar?mes=${monthParam(month)}`}
            download
            className={buttonVariants({ variant: "secondary" })}
          >
            <Download aria-hidden="true" />
            Exportar CSV
          </a>
        }
      />
      <PageBody className="flex flex-col gap-4 md:gap-6">
        <MonthNav month={month} className="self-start" />
        <FinanceSummary report={report} />
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="flex flex-col gap-4 md:gap-6">
            <RevenueChart points={trend} currentMonth={month} />
            <MonthReservations stays={report.stays} />
          </div>
          <RevenueBreakdown report={report} />
        </div>
      </PageBody>
    </>
  );
}
