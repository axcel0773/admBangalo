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
  ScheduleCard,
  taxDefaults,
} from "@/features/billing";
import { requireOwner } from "@/features/auth/session";
import { CommissionCard, commissionOf, listBrokerNames } from "@/features/commissions";
import { listFees } from "@/features/fees";
import { DeleteReservationCard, getReservationDetail, ReservationDetail } from "@/features/reservations";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Reserva" };

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, owner, brokers, fees] = await Promise.all([
    getReservationDetail(id),
    requireOwner(),
    listBrokerNames(),
    listFees(),
  ]);
  if (!detail) notFound();

  const { reservation, financials, charges, mainGuest } = detail;
  const billing = await getReservationBilling({
    reservationId: id,
    chaletId: reservation.chalet_id,
    balance: financials.balance_due,
    paid: financials.paid_total,
  });

  const energy = findEnergyCharge(charges);
  const energyTariff = energy?.unit_amount ?? billing.meteredFee?.amount ?? null;
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
          businessName={owner.businessName}
          billing={
            <>
              {/* Sem taxa de energia cadastrada não há leitura a fazer: o cartão nem aparece. */}
              {!cancelled && energyTariff !== null ? (
                <EnergyCard
                  action={saveMeterReading.bind(null, id)}
                  status={reservation.status}
                  reading={{ start: energy?.meter_start ?? null, end: energy?.meter_end ?? null }}
                  tariff={energyTariff}
                />
              ) : null}
              <ChargesCard
                reservation={reservation}
                charges={charges}
                grandTotal={financials.grand_total}
                taxDefaults={taxDefaults(fees, reservation.chalet_id)}
              />
              <DeleteReservationCard reservationId={id} paid={financials.paid_total} />
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
              <CommissionCard
                reservationId={id}
                commission={commissionOf(reservation)}
                total={financials.grand_total}
                cancelled={cancelled}
                brokers={brokers}
                today={todayIso()}
              />
              <ScheduleCard
                reservationId={id}
                schedule={billing.schedule}
                total={financials.grand_total}
                checkIn={reservation.check_in}
                today={todayIso()}
                cancelled={cancelled}
                nextPix={billing.nextInstallmentPix}
                paid={financials.paid_total}
                firstPaidOn={billing.firstPaidOn}
              />
              <PaymentsCard
                reservationId={id}
                ownerId={billing.ownerId}
                payments={billing.payments}
                context={paymentContext}
              />
            </>
          }
        />
      </PageBody>
    </>
  );
}
