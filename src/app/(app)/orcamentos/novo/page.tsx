import { House } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NewQuoteForm } from "@/features/quotes";
import { getNewReservationContext } from "@/features/reservations";
import { isIsoDate, todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Novo orçamento" };

interface NewQuotePageProps {
  searchParams: Promise<{ chale?: string; entrada?: string }>;
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
  const [{ chale, entrada }, context] = await Promise.all([searchParams, getNewReservationContext()]);

  return (
    <>
      <PageHeader title="Novo orçamento" back={{ href: routes.quotes, label: "Orçamentos" }} />
      <PageBody className="max-w-5xl">
        {context.chalets.length === 0 ? (
          <EmptyState
            icon={<House />}
            title="Cadastre um bangalô primeiro"
            description="Os orçamentos usam a diária, a capacidade e as taxas do bangalô."
            action={<ButtonLink href={routes.newChalet}>Cadastrar bangalô</ButtonLink>}
          />
        ) : (
          <NewQuoteForm
            chalets={context.chalets}
            fees={context.fees}
            seasons={context.seasons}
            blocks={context.blocks}
            today={todayIso()}
            prefill={{ chaletId: chale, checkIn: entrada && isIsoDate(entrada) ? entrada : undefined }}
          />
        )}
      </PageBody>
    </>
  );
}
