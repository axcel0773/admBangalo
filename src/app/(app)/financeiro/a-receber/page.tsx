import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { FilterChips } from "@/components/ui/filter-chips";
import {
  getReceivables,
  isReceivableFilter,
  RECEIVABLE_FILTERS,
  ReceivablesList,
  ReceivablesTotal,
  summarizeReceivables,
  type ReceivableFilter,
} from "@/features/dashboard";

export const metadata: Metadata = { title: "A receber" };

interface ReceivablesPageProps {
  searchParams: Promise<{ filtro?: string }>;
}

export default async function ReceivablesPage({ searchParams }: ReceivablesPageProps) {
  const { filtro } = await searchParams;
  const filter: ReceivableFilter = isReceivableFilter(filtro) ? filtro : "all";
  const items = await getReceivables();
  const summary = summarizeReceivables(items);

  const count = (key: ReceivableFilter) => (key === "all" ? summary.count : summary.byStatus[key].count);
  const chips = (Object.keys(RECEIVABLE_FILTERS) as ReceivableFilter[]).map((key) => ({
    href: key === "all" ? routes.receivables : `${routes.receivables}?filtro=${key}`,
    label: `${RECEIVABLE_FILTERS[key]} ${count(key)}`,
    active: key === filter,
  }));

  return (
    <>
      <PageHeader
        title="A receber"
        description="Saldos em aberto de todas as reservas, do mais atrasado ao mais distante."
        back={{ href: routes.dashboard, label: "Painel" }}
      />
      <PageBody className="flex max-w-3xl flex-col gap-4 md:gap-6">
        <ReceivablesTotal summary={summary} />
        <FilterChips chips={chips} label="Filtrar por vencimento" />
        <ReceivablesList items={items} filter={filter} />
      </PageBody>
    </>
  );
}
