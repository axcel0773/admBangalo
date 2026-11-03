import { roundMoney } from "@/features/reservations/domain";
import type { Enums } from "@/types/database";

export type PaymentKind = Enums<"payment_kind">;
export type PaymentMethod = Enums<"payment_method">;

export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  deposit: "Sinal",
  installment: "Parcela",
  balance: "Saldo",
  refund: "Estorno",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_transfer: "Transferência",
  platform: "Plataforma (Airbnb/Booking)",
  other: "Outro",
};

export interface PaymentContext {
  reservationStatus: Enums<"reservation_status">;
  /** Total já pago (pagamentos − estornos). */
  paid: number;
  /** Saldo a receber (pode ser negativo se pagou a mais). */
  balance: number;
}

export interface PaymentProblem {
  field: "amount" | "kind";
  message: string;
}

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Regras do lançamento:
 * - reserva cancelada só aceita estorno;
 * - estorno não passa do que foi pago;
 * - pagamento não passa do saldo (evita erro de digitação; ajuste as taxas se precisar).
 */
export function validatePayment(
  input: { kind: PaymentKind; amount: number },
  context: PaymentContext,
): PaymentProblem | null {
  const amount = roundMoney(input.amount);
  if (!(amount > 0)) return { field: "amount", message: "Informe um valor maior que zero." };

  if (input.kind === "refund") {
    if (amount > roundMoney(context.paid)) {
      return { field: "amount", message: `O estorno passa do que foi pago (${brl(Math.max(context.paid, 0))}).` };
    }
    return null;
  }

  if (context.reservationStatus === "cancelled") {
    return { field: "kind", message: "Reserva cancelada: só é possível lançar estorno." };
  }
  if (amount > roundMoney(Math.max(context.balance, 0))) {
    return {
      field: "amount",
      message:
        context.balance > 0
          ? `O valor passa do saldo a receber (${brl(context.balance)}).`
          : "Esta reserva já está quitada.",
    };
  }
  return null;
}

/** Tipo sugerido para o próximo lançamento. */
export function suggestedPaymentKind(context: PaymentContext): PaymentKind {
  if (context.reservationStatus === "cancelled") return "refund";
  // Já quitada: o único lançamento possível é devolver algo ao hóspede.
  if (context.balance <= 0 && context.paid > 0) return "refund";
  return context.paid <= 0 ? "deposit" : "balance";
}

/** Valor sugerido: o saldo; na cancelada, o que foi pago; na quitada, nada (o dono digita). */
export function suggestedPaymentAmount(context: PaymentContext): number {
  if (context.reservationStatus === "cancelled") return roundMoney(Math.max(context.paid, 0));
  return roundMoney(Math.max(context.balance, 0));
}

/** Valor com sinal para somas (estorno subtrai). */
export function signedAmount(payment: { kind: PaymentKind; amount: number }): number {
  return payment.kind === "refund" ? -payment.amount : payment.amount;
}
