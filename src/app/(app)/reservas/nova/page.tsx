import { House } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getNewReservationContext, NewReservationForm } from "@/features/reservations";
import { isIsoDate, todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Nova reserva" };

interface NewReservationPageProps {
  searchParams: Promise<{ chale?: string; entrada?: string; hospede?: string }>;
}

export default async function NewReservationPage({ searchParams }: NewReservationPageProps) {
  const [{ chale, entrada, hospede }, context] = await Promise.all([searchParams, getNewReservationContext()]);

  return (
    <>
      <PageHeader title="Nova reserva" back={{ href: routes.reservations, label: "Reservas" }} />
      <PageBody className="max-w-5xl">
        {context.chalets.length === 0 ? (
          <EmptyState
            icon={<House />}
            title="Cadastre um chalé primeiro"
            description="As reservas precisam de um chalé ativo com capacidade e diária."
            action={<ButtonLink href={routes.newChalet}>Cadastrar chalé</ButtonLink>}
          />
        ) : (
          <NewReservationForm
            chalets={context.chalets}
            fees={context.fees}
            guests={context.guests}
            seasons={context.seasons}
            blocks={context.blocks}
            today={todayIso()}
            prefill={{
              chaletId: chale,
              checkIn: entrada && isIsoDate(entrada) ? entrada : undefined,
              guestId: hospede,
            }}
          />
        )}
      </PageBody>
    </>
  );
}
