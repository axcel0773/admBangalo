import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import {
  BalanceCard,
  ChargesCard,
  EnergyCard,
  findEnergyCharge,
  getReservationBilling,
  PaymentsCard,
  saveMeterReading,
} from "@/features/billing";
import { getReservationDetail, ReservationDetail } from "@/features/reservations";

export const metadata: Metadata = { title: "Reserva" };

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getReservationDetail(id);
  if (!detail) notFound();

  const { reservation, financials, charges, mainGuest } = detail;
  const billing = await getReservationBilling({
    reservationId: id,
    chaletId: reservation.chalet_id,
    balance: financials.balance_due,
  });

  const energy = findEnergyCharge(charges);
  const cancelled = reservation.status === "cancelled";
  const paymentContext = {
    reservationStatus: reservation.status,
    paid: financials.paid_total,
    balance: financials.balance_due,
  };

  return (
    <>
      <PageHeader title="Reserva" back={{ href: routes.reservations, label: "Reservas" }} />
      <PageBody>
        <ReservationDetail
          detail={detail}
          billing={
            <>
              {!cancelled ? (
                <EnergyCard
                  action={saveMeterReading.bind(null, id)}
                  status={reservation.status}
                  reading={{ start: energy?.meter_start ?? null, end: energy?.meter_end ?? null }}
                  tariff={energy?.unit_amount ?? billing.meteredFee?.amount ?? null}
                />
              ) : null}
              <ChargesCard reservation={reservation} charges={charges} grandTotal={financials.grand_total} />
            </>
          }
          aside={
            <>
              <BalanceCard
                total={financials.grand_total}
                paid={financials.paid_total}
                balance={financials.balance_due}
                cancelled={cancelled}
                pix={billing.pix}
                hasPixKey={billing.hasPixKey}
                guestName={mainGuest.full_name}
                guestPhone={mainGuest.phone}
              />
              <PaymentsCard reservationId={id} payments={billing.payments} context={paymentContext} />
            </>
          }
        />
      </PageBody>
    </>
  );
}
