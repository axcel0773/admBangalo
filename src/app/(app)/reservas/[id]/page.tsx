import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { getReservationDetail, ReservationDetail } from "@/features/reservations";

export const metadata: Metadata = { title: "Reserva" };

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getReservationDetail(id);
  if (!detail) notFound();

  return (
    <>
      <PageHeader title="Reserva" back={{ href: routes.reservations, label: "Reservas" }} />
      <PageBody>
        <ReservationDetail detail={detail} />
      </PageBody>
    </>
  );
}
