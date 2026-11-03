import type { Enums } from "@/types/database";

import type { ReservationStatus } from "./types";

export type ReservationSource = Enums<"reservation_source">;

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  checked_in: "Hospedado",
  checked_out: "Finalizada",
  cancelled: "Cancelada",
};

export const SOURCE_LABELS: Record<ReservationSource, string> = {
  direct: "Direto",
  whatsapp: "WhatsApp",
  airbnb: "Airbnb",
  booking: "Booking",
  other: "Outro",
};

export interface StatusTransition {
  to: ReservationStatus;
  label: string;
  /** Ação principal (botão cheio) ou secundária. */
  primary: boolean;
  /** Pede confirmação antes (ações difíceis de desfazer). */
  destructive?: boolean;
}

/**
 * Máquina de estados da reserva:
 * pendente → confirmada → hospedado → finalizada; cancelar só antes do check-in.
 */
const TRANSITIONS: Record<ReservationStatus, StatusTransition[]> = {
  pending: [
    { to: "confirmed", label: "Confirmar reserva", primary: true },
    { to: "cancelled", label: "Cancelar", primary: false, destructive: true },
  ],
  confirmed: [
    { to: "checked_in", label: "Fazer check-in", primary: true },
    { to: "cancelled", label: "Cancelar", primary: false, destructive: true },
  ],
  checked_in: [{ to: "checked_out", label: "Fazer check-out", primary: true }],
  checked_out: [],
  cancelled: [],
};

export function availableTransitions(status: ReservationStatus): StatusTransition[] {
  return TRANSITIONS[status];
}

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from].some((transition) => transition.to === to);
}

/** Campos de data/hora que acompanham cada mudança de status. */
export function timestampsFor(
  to: ReservationStatus,
  now: Date = new Date(),
): Partial<Record<"checked_in_at" | "checked_out_at" | "cancelled_at", string>> {
  const iso = now.toISOString();
  if (to === "checked_in") return { checked_in_at: iso };
  if (to === "checked_out") return { checked_out_at: iso };
  if (to === "cancelled") return { cancelled_at: iso };
  return {};
}
