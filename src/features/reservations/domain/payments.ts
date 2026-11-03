import { roundMoney } from "./pricing";
import type { PaymentEntry, PaymentStatus, ReservationStatus } from "./types";

/** Pagamentos menos estornos (mesma regra da view reservation_financials). */
export function paidAmount(payments: PaymentEntry[]): number {
  return roundMoney(
    payments.reduce((sum, p) => sum + (p.kind === "refund" ? -p.amount : p.amount), 0),
  );
}

export function balanceDue(total: number, paid: number): number {
  return roundMoney(total - paid);
}

export function paymentStatus(input: {
  reservationStatus: ReservationStatus;
  total: number;
  paid: number;
}): PaymentStatus {
  if (input.reservationStatus === "cancelled") return "cancelled";
  if (input.paid <= 0) return "unpaid";
  if (input.paid < input.total) return "partial";
  return "paid";
}

/** Fração paga entre 0 e 1, para barras de progresso. */
export function paidRatio(total: number, paid: number): number {
  if (total <= 0) return paid > 0 ? 1 : 0;
  return Math.min(Math.max(paid / total, 0), 1);
}
