import { CalendarPlus, NotebookTabs } from "lucide-react";

import { paths, routes } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard, ListRow } from "@/components/ui/list-row";
import { formatStayRange } from "@/lib/dates";
import { formatCurrency, pluralize } from "@/lib/format";

import type { ReservationListItem } from "../data/reservations.repository";
import { PaymentStatusBadge } from "./payment-status-badge";
import { ReservationStatusBadge } from "./reservation-status-badge";

export function ReservationList({ reservations }: { reservations: ReservationListItem[] }) {
  if (reservations.length === 0) {
    return (
      <EmptyState
        icon={<NotebookTabs />}
        title="Nenhuma reserva aqui"
        description="Quando houver reservas neste filtro, elas aparecem nesta lista."
        action={
          <ButtonLink href={routes.newReservation}>
            <CalendarPlus aria-hidden="true" />
            Nova reserva
          </ButtonLink>
        }
      />
    );
  }

  return (
    <ListCard>
      {reservations.map((reservation) => (
        <ListRow
          key={reservation.reservation_id}
          href={paths.reservation(reservation.reservation_id)}
          leading={<Avatar name={reservation.main_guest_name} />}
          title={reservation.main_guest_name}
          subtitle={[
            reservation.chalet_name,
            `${formatStayRange(reservation.check_in, reservation.check_out)} · ${pluralize(reservation.nights, "noite", "noites")}`,
            pluralize(reservation.guests_count, "pessoa", "pessoas"),
            formatCurrency(reservation.grand_total),
          ].join(" · ")}
          trailing={
            <span className="flex flex-col items-end gap-1">
              <ReservationStatusBadge status={reservation.status} />
              {reservation.status !== "cancelled" ? <PaymentStatusBadge status={reservation.payment_status} /> : null}
            </span>
          }
        />
      ))}
    </ListCard>
  );
}
