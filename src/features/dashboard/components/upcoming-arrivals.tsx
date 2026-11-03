import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { CardSection } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { PaymentStatusBadge } from "@/features/reservations/components/payment-status-badge";
import { formatStayRange } from "@/lib/dates";
import { pluralize } from "@/lib/format";

import type { UpcomingArrival } from "../domain/types";

/** Lista no celular; em telas largas as colunas se alinham como tabela. */
export function UpcomingArrivals({ arrivals }: { arrivals: UpcomingArrival[] }) {
  return (
    <CardSection title="Próximas chegadas" titleId="upcoming-title">
      {arrivals.length === 0 ? (
        <p className="py-4 text-sm text-ink-muted">Nenhuma reserva futura.</p>
      ) : (
        <ul className="divide-y divide-line">
          {arrivals.map((arrival) => (
            <li key={arrival.reservationId}>
              <Link
                href={`${routes.reservations}/${arrival.reservationId}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 py-3 text-ink lg:grid-cols-[auto_1.4fr_1fr_1fr_auto_auto] lg:gap-x-6"
              >
                <Avatar name={arrival.guestName} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{arrival.guestName}</span>
                  <span className="block text-xs text-ink-muted lg:hidden">
                    {arrival.chaletName} · {formatStayRange(arrival.checkIn, arrival.checkOut)}
                  </span>
                </span>
                <span className="hidden text-sm lg:block">{arrival.chaletName}</span>
                <span className="hidden text-sm lg:block">
                  {formatStayRange(arrival.checkIn, arrival.checkOut)} ·{" "}
                  {pluralize(arrival.nights, "noite", "noites")}
                </span>
                <Money value={arrival.total} className="hidden text-sm lg:block" />
                <PaymentStatusBadge status={arrival.paymentStatus} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}
