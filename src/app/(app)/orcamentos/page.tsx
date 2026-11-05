import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { listQuotes, QuoteList } from "@/features/quotes";

export const metadata: Metadata = { title: "Orçamentos" };

export default async function QuotesPage() {
  const quotes = await listQuotes();

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
        <QuoteList quotes={quotes} />
      </PageBody>
    </>
  );
}
