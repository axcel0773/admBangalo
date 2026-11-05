import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { filterQuotes, isQuoteFilter, listQuotes, QUOTE_FILTERS, QuoteList, type QuoteFilter } from "@/features/quotes";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Orçamentos" };

interface QuotesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const { status } = await searchParams;
  const filter: QuoteFilter = isQuoteFilter(status) ? status : "all";
  const quotes = filterQuotes(await listQuotes(), filter, todayIso());
  const chips = (Object.keys(QUOTE_FILTERS) as QuoteFilter[]).map((key) => ({
    href: key === "all" ? routes.quotes : `${routes.quotes}?status=${key}`,
    label: QUOTE_FILTERS[key],
    active: key === filter,
  }));

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Simulações enviadas aos hóspedes antes da reserva."
        actions={
          <ButtonLink href={routes.newQuote} size="sm">
            <Plus aria-hidden="true" />
            Novo orçamento
          </ButtonLink>
        }
      />
      <PageBody>
        <FilterChips label="Situação do orçamento" chips={chips} />
        <QuoteList quotes={quotes} filtered={filter !== "all"} />
      </PageBody>
    </>
  );
}
