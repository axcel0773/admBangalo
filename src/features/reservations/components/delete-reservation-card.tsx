import { Trash2 } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { formatCurrency } from "@/lib/format";

import { deleteReservation } from "../actions";

interface DeleteReservationCardProps {
  reservationId: string;
  /** Pagamentos − estornos. Diferente de zero trava a exclusão. */
  paid: number;
}

/**
 * Excluir de vez (limpar reservas de teste ou lançadas por engano).
 * Com dinheiro registrado a exclusão fica travada: sumiria do Financeiro sem rastro.
 * O banco confere a mesma regra, então esta tela só explica.
 */
export function DeleteReservationCard({ reservationId, paid }: DeleteReservationCardProps) {
  const locked = paid !== 0;

  return (
    <CardSection title="Excluir reserva" titleId="reservation-delete">
      {locked ? (
        <p className="text-sm text-ink-muted">
          Esta reserva tem {formatCurrency(paid)} em pagamentos. Para excluir, estorne todo o valor em
          “Pagamentos” (o estorno zera o saldo). Se a reserva só deixou de acontecer, use “Cancelar”: ela
          continua no histórico e no Financeiro.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">
            Apaga a reserva de vez, com taxas e parcelas. As datas voltam a ficar livres. Não dá para desfazer.
          </p>
          <ActionForm action={deleteReservation.bind(null, reservationId)}>
            <ConfirmSubmit
              message="Excluir esta reserva? Não dá para desfazer."
              confirmLabel="Sim, excluir"
              pendingLabel="Excluindo…"
              triggerVariant="secondary"
            >
              <Trash2 aria-hidden="true" />
              Excluir reserva
            </ConfirmSubmit>
          </ActionForm>
        </>
      )}
    </CardSection>
  );
}
