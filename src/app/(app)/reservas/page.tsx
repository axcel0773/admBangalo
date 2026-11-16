import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { ShowMore } from "@/components/ui/show-more";
import { listChalets } from "@/features/chalets";
import {
  isReservationView,
  listReservations,
  RESERVATION_VIEWS,
  ReservationList,
  type ReservationView,
} from "@/features/reservations";

import { toPageSize } from "@/lib/search-params";

export const metadata: Metadata = { title: "Reservas" };

interface ReservationsPageProps {
  searchParams: Promise<{ ver?: string; chale?: string; n?: string }>;
}

function hrefFor(view: ReservationView, chalet?: string, size?: number): string {
  const params = new URLSearchParams({ ver: view });
  if (chalet) params.set("chale", chalet);
  if (size) params.set("n", String(size));
  return `${routes.reservations}?${params.toString()}`;
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const { ver, chale, n } = await searchParams;
  const view: ReservationView = isReservationView(ver) ? ver : "upcoming";

  const [{ reservations, nextSize }, chalets] = await Promise.all([
    listReservations(view, chale, toPageSize(n)),
    listChalets(),
  ]);

  const viewChips = (Object.keys(RESERVATION_VIEWS) as ReservationView[]).map((key) => ({
    href: hrefFor(key, chale),
    label: RESERVATION_VIEWS[key],
    active: key === view,
  }));

  const chaletChips = [
    { href: hrefFor(view), label: "Todos os bangalôs", active: !chale },
    ...chalets.map((chalet) => ({
      href: hrefFor(view, chalet.id),
      label: chalet.name,
      active: chalet.id === chale,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Reservas"
        actions={
          <ButtonLink href={routes.newReservation} size="sm">
            <Plus aria-hidden="true" />
            Nova reserva
          </ButtonLink>
        }
      />
      <PageBody className="max-w-4xl">
        <div className="flex flex-col gap-2.5">
          <FilterChips label="Situação" chips={viewChips} />
          {chalets.length > 1 ? <FilterChips label="Bangalô" chips={chaletChips} /> : null}
        </div>
        <ReservationList reservations={reservations} />
        {nextSize ? <ShowMore href={hrefFor(view, chale, nextSize)} shown={reservations.length} /> : null}
      </PageBody>
    </>
  );
}
