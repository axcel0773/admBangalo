import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getYearReport, parseYearParam, YearReportView } from "@/features/finance";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Relatórios" };

interface ReportsPageProps {
  searchParams: Promise<{ ano?: string }>;
}

const linkClass = "flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface";

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { ano } = await searchParams;
  const year = parseYearParam(ano, todayIso());
  const report = await getYearReport(year);

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Ocupação, diária média e origem das reservas, ano a ano."
        back={{ href: routes.finance, label: "Financeiro" }}
        actions={
          // <a> comum: é um download, não uma navegação do Next.
          <a href={`${routes.reports}/exportar?ano=${year}`} download className={buttonVariants({ variant: "secondary" })}>
            <Download aria-hidden="true" />
            Exportar CSV
          </a>
        }
      />
      <PageBody className="flex max-w-3xl flex-col gap-4 md:gap-6">
        <nav aria-label="Ano" className="flex items-center gap-1 self-start rounded-2xl bg-muted p-1">
          <Link href={`${routes.reports}?ano=${year - 1}`} aria-label="Ano anterior" className={linkClass}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>
          <span className="flex h-10 min-w-28 items-center justify-center rounded-xl bg-surface px-4 text-sm font-semibold shadow-sm">
            {year}
          </span>
          <Link href={`${routes.reports}?ano=${year + 1}`} aria-label="Próximo ano" className={linkClass}>
            <ChevronRight className="size-5" aria-hidden="true" />
          </Link>
        </nav>
        <YearReportView report={report} />
      </PageBody>
    </>
  );
}
