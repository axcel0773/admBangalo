import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

import { changeReservationStatus } from "../actions";
import { availableTransitions } from "../domain/status";
import type { ReservationStatus } from "../domain/types";
import { ConfirmSubmit } from "./confirm-submit";

/** Botões das próximas etapas da reserva (confirmar, check-in, check-out, cancelar). */
export function StatusActions({ reservationId, status }: { reservationId: string; status: ReservationStatus }) {
  const transitions = availableTransitions(status);
  if (transitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {transitions.map((transition) => {
        const action = changeReservationStatus.bind(null, reservationId, transition.to);
        return (
          <form key={transition.to} action={action} className="flex-1 sm:flex-none">
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
          </form>
        );
      })}
    </div>
  );
}
