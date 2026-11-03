import { Trash2 } from "lucide-react";

import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Money } from "@/components/ui/money";
import { formatShortDate, todayIso } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

import { registerPayment, removePayment } from "../actions";
import type { Payment } from "../data/billing.repository";
import {
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  signedAmount,
  suggestedPaymentAmount,
  suggestedPaymentKind,
  type PaymentContext,
} from "../domain/payments";
import { PaymentForm } from "./payment-form";

interface PaymentsCardProps {
  reservationId: string;
  payments: Payment[];
  context: PaymentContext;
}

/** Lançamentos de pagamento e estorno da reserva. */
export function PaymentsCard({ reservationId, payments, context }: PaymentsCardProps) {
  const settled = context.reservationStatus !== "cancelled" && context.balance <= 0;
  const canAdd = context.balance > 0 || context.paid > 0;

  return (
    <CardSection title="Pagamentos" titleId="reservation-payments">
      {payments.length === 0 ? (
        <p className="pb-3 text-sm text-ink-muted">Nenhum pagamento registrado.</p>
      ) : (
        <ul className="mb-3 divide-y divide-line">
          {payments.map((payment) => {
            const refund = payment.kind === "refund";
            return (
              <li key={payment.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {PAYMENT_KIND_LABELS[payment.kind]} · {PAYMENT_METHOD_LABELS[payment.method]}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {formatShortDate(payment.paid_at)}
                    {payment.notes ? ` · ${payment.notes}` : ""}
                  </span>
                </span>
                <Money
                  value={signedAmount(payment)}
                  tone={refund ? "pending" : "positive"}
                  className="text-[15px] font-bold"
                />
                <form action={removePayment.bind(null, reservationId, payment.id)} className="contents">
                  <ConfirmSubmit
                    message={`Remover o lançamento de ${formatCurrency(payment.amount)}?`}
                    confirmLabel="Remover"
                    pendingLabel="Removendo…"
                    triggerSize="icon"
                    triggerLabel="Remover lançamento"
                    block={false}
                    className="size-9 text-ink-muted"
                  >
                    <Trash2 aria-hidden="true" />
                  </ConfirmSubmit>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {settled ? (
        <p className="mb-3 rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary-ink">Reserva quitada.</p>
      ) : null}

      {canAdd ? (
        <PaymentForm
          action={registerPayment.bind(null, reservationId)}
          suggestedKind={suggestedPaymentKind(context)}
          suggestedAmount={suggestedPaymentAmount(context)}
          today={todayIso()}
        />
      ) : null}
    </CardSection>
  );
}
