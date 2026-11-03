import { NotebookTabs } from "lucide-react";
import Link from "next/link";

import { paths } from "@/components/layout/navigation";
import { CardSection } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { PaymentStatusBadge } from "@/features/reservations";
import { formatStayRange } from "@/lib/dates";

import type { FinanceStay } from "../domain";

/** Reservas com check-in no mês: total, pago e saldo de cada uma. */
export function MonthReservations({ stays }: { stays: FinanceStay[] }) {
  return (
    <CardSection title="Reservas do mês" titleId="finance-reservations">
      {stays.length === 0 ? (
        <EmptyState
          icon={<NotebookTabs />}
          title="Nenhuma reserva neste mês"
          description="Reservas com entrada neste mês aparecem aqui com o que já foi pago."
        />
      ) : (
        <ul className="divide-y divide-line">
          {stays.map((stay) => (
            <li key={stay.reservation_id}>
              <Link href={paths.reservation(stay.reservation_id)} className="flex items-center gap-3 py-3 text-ink">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{stay.main_guest_name}</span>
                  <span className="block truncate text-xs text-ink-muted">
                    {formatStayRange(stay.check_in, stay.check_out)} · {stay.chalet_name}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <Money value={stay.grand_total} className="text-sm font-bold" />
                  {stay.balance_due > 0 ? (
                    <span className="text-xs font-semibold text-accent-ink">
                      falta <Money value={stay.balance_due} />
                    </span>
                  ) : (
                    <PaymentStatusBadge status={stay.payment_status} />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}
