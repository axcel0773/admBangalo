import { daysBetween, isIsoDate, type IsoDate } from "@/lib/dates";

import { quoteStay, type StayQuote } from "./pricing";
import type { FeeRule } from "./types";

/** O mínimo de taxa que a prévia precisa (vem da tabela fees). */
export interface FeeForQuote extends FeeRule {
  chalet_id: string | null;
  active: boolean;
  auto_apply: boolean;
}

export interface ChaletForQuote {
  id: string;
  base_guests: number;
  max_guests: number;
  base_nightly_rate: number;
}

/** Taxas que o banco aplicaria automaticamente neste chalé. */
export function autoFeesFor(chaletId: string, fees: FeeForQuote[]): FeeRule[] {
  return fees
    .filter((fee) => fee.active && fee.auto_apply && (fee.chalet_id === null || fee.chalet_id === chaletId))
    .map(({ name, kind, mode, amount }) => ({ name, kind, mode, amount }));
}

export function nightsOf(checkIn: string, checkOut: string): number {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return 0;
  return Math.max(daysBetween(checkIn, checkOut), 0);
}

export interface ReservationDraft {
  chalet: ChaletForQuote | null;
  checkIn: IsoDate | "";
  checkOut: IsoDate | "";
  adults: number;
  children: number;
  nightlyRate: number;
  discount: number;
}

export interface DraftIssues {
  dates?: string;
  capacity?: string;
}

/** Problemas que dá para apontar antes de enviar (o banco confere de novo). */
export function validateDraft(draft: ReservationDraft): DraftIssues {
  const issues: DraftIssues = {};
  if (draft.checkIn && draft.checkOut && nightsOf(draft.checkIn, draft.checkOut) < 1) {
    issues.dates = "A saída precisa ser depois da entrada.";
  }
  if (draft.chalet && draft.adults + draft.children > draft.chalet.max_guests) {
    issues.capacity = `Este chalé recebe até ${draft.chalet.max_guests} pessoas.`;
  }
  return issues;
}

/** Prévia de valores da nova reserva, com as mesmas regras do banco. */
export function quoteDraft(draft: ReservationDraft, fees: FeeForQuote[]): StayQuote | null {
  if (!draft.chalet || !draft.checkIn || !draft.checkOut) return null;
  const nights = nightsOf(draft.checkIn, draft.checkOut);
  if (nights < 1) return null;

  return quoteStay({
    stay: { nights, guests: draft.adults + draft.children, includedGuests: draft.chalet.base_guests },
    nightlyRate: draft.nightlyRate,
    discount: draft.discount,
    fees: autoFeesFor(draft.chalet.id, fees),
  });
}
