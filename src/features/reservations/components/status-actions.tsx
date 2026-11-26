import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { SubmitButton } from "@/components/ui/submit-button";

import { changeReservationStatus } from "../actions";
import { availableTransitions } from "../domain/status";
import type { ReservationStatus } from "../domain/types";

interface StatusActionsProps {
  reservationId: string;
  status: ReservationStatus;
  /**
   * "steps": só os próximos passos (confirmar, check-in, check-out), à mostra.
   * "cancel": só o cancelar, guardado em "Mais opções" para não ser tocado por engano.
   */
  show?: "all" | "steps" | "cancel";
}

/** Botões das próximas etapas da reserva (confirmar, check-in, check-out, cancelar). */
export function StatusActions({ reservationId, status, show = "all" }: StatusActionsProps) {
  const transitions = availableTransitions(status).filter((transition) =>
    show === "all" ? true : show === "cancel" ? transition.destructive : !transition.destructive,
  );
  if (transitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {transitions.map((transition) => {
        const action = changeReservationStatus.bind(null, reservationId, transition.to);
        return (
          <ActionForm key={transition.to} action={action} className="flex-1 sm:flex-none">
            {transition.destructive ? (
              <ConfirmSubmit message="Cancelar esta reserva? As datas voltam a ficar livres no calendário.">
                {transition.label}
              </ConfirmSubmit>
            ) : transition.primary ? (
              <SubmitButton block pendingLabel="Atualizando…">
                {transition.label}
              </SubmitButton>
            ) : (
              <Button type="submit" variant="secondary" block>
                {transition.label}
              </Button>
            )}
          </ActionForm>
        );
      })}
    </div>
  );
}
