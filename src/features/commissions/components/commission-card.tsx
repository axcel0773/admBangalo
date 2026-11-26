import { Trash2, Undo2 } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Money } from "@/components/ui/money";
import { PAYMENT_METHOD_LABELS } from "@/features/billing/domain/payments";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

import { payCommission, removeCommission, saveCommission, unpayCommission } from "../actions";
import { describeCommissionShare, type Commission } from "../domain";
import { AddCommission, CommissionEditForm, PayCommission } from "./commission-forms";

interface CommissionCardProps {
  reservationId: string;
  commission: Commission | null;
  /** Total da reserva (para a porcentagem e os atalhos). */
  total: number;
  cancelled: boolean;
  brokers: string[];
  today: string;
}

/** Comissão do corretor na tela da reserva: adicionar, editar, marcar paga ou desfazer. */
export function CommissionCard({ reservationId, commission, total, cancelled, brokers, today }: CommissionCardProps) {
  const save = saveCommission.bind(null, reservationId);

  if (!commission) {
    return (
      <CardSection title="Comissão do corretor" titleId="reservation-commission">
        <p className="pb-3 text-sm text-ink-muted">Sem corretor nesta reserva.</p>
        <AddCommission action={save} brokers={brokers} total={total} />
      </CardSection>
    );
  }

  const { paidOn } = commission;
  const paid = paidOn !== null;
  const share = describeCommissionShare(commission.amount, total);

  return (
    <CardSection title="Comissão do corretor" titleId="reservation-commission">
      <div className="flex flex-col">
        <InlineEdit
          label={`comissão de ${formatCurrency(commission.amount)}`}
          rowClassName="flex items-center gap-3"
          editor={
            <CommissionEditForm
              action={save}
              brokers={brokers}
              total={total}
              initial={{ brokerName: commission.brokerName, amount: commission.amount }}
            />
          }
          trailing={
            <ActionForm action={removeCommission.bind(null, reservationId)} className="contents">
              <ConfirmSubmit
                message={
                  paid
                    ? `Remover a comissão de ${formatCurrency(commission.amount)}? Ela sai também das despesas do mês.`
                    : `Remover a comissão de ${formatCurrency(commission.amount)}?`
                }
                confirmLabel="Remover"
                pendingLabel="Removendo…"
                triggerSize="icon"
                triggerLabel="Remover comissão"
                block={false}
                className="size-11 text-ink-muted md:size-9"
              >
                <Trash2 aria-hidden="true" />
              </ConfirmSubmit>
            </ActionForm>
          }
        >
          <Avatar name={commission.brokerName} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">{commission.brokerName}</span>
            {share ? <span className="block text-xs text-ink-muted">{share}</span> : null}
          </span>
          <Money value={commission.amount} className="font-display text-lg font-semibold" />
        </InlineEdit>
      </div>

      <div className="my-3 flex flex-wrap items-center gap-2">
        {paidOn ? (
          <Badge tone="success">
            Paga em {formatShortDate(paidOn)}
            {commission.method ? ` · ${PAYMENT_METHOD_LABELS[commission.method]}` : ""}
          </Badge>
        ) : (
          <Badge tone="warning">A pagar</Badge>
        )}
      </div>

      {cancelled && !paid ? (
        <p className="mb-3 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          A reserva foi cancelada. Pague a comissão só se combinou isso com o corretor; se não, remova-a.
        </p>
      ) : null}

      {paid ? (
        <ActionForm action={unpayCommission.bind(null, reservationId)}>
          <ConfirmSubmit
            message="Voltar a comissão para “a pagar”? Ela sai das despesas do mês."
            confirmLabel="Desfazer"
            pendingLabel="Desfazendo…"
            triggerVariant="secondary"
          >
            <Undo2 aria-hidden="true" />
            Desfazer pagamento
          </ConfirmSubmit>
        </ActionForm>
      ) : (
        <PayCommission action={payCommission.bind(null, reservationId)} today={today} />
      )}
    </CardSection>
  );
}
