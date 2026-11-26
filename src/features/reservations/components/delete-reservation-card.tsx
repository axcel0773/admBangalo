import { ChevronDown, Trash2 } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { formatCurrency } from "@/lib/format";

import { deleteReservation } from "../actions";

interface DeleteReservationCardProps {
  reservationId: string;
  /** Pagamentos − estornos. Diferente de zero trava a exclusão. */
  paid: number;
}

/**
 * Excluir de vez (limpar reservas de teste ou lançadas por engano). Fica fechado: só abre
 * quando a pessoa toca, para não ser confundido com as ações do dia a dia.
 * Com dinheiro registrado a exclusão fica travada: sumiria do Financeiro sem rastro.
 * O banco confere a mesma regra, então esta tela só explica.
 */
export function DeleteReservationCard({ reservationId, paid }: DeleteReservationCardProps) {
  const locked = paid !== 0;

  return (
    <Card className="p-0">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink-muted md:px-6 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Trash2 aria-hidden="true" className="size-4" />
            Excluir reserva
          </span>
          <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="animate-expand origin-top px-4 pb-4 md:px-6 md:pb-6">
          {locked ? (
            <p className="text-sm text-ink-muted">
              Esta reserva tem {formatCurrency(paid)} em pagamentos. Para excluir, estorne todo o valor em
              “Pagamentos” (o estorno zera o saldo). Se a reserva só deixou de acontecer, use “Cancelar”, em
              “Mais opções”: ela continua no histórico e no Financeiro.
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
        </div>
      </details>
    </Card>
  );
}
