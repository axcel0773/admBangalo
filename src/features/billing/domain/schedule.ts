import { roundMoney } from "@/features/reservations/domain";
import type { IsoDate } from "@/lib/dates";

/**
 * Parcelas previstas (tabela payment_schedule). O total pago é distribuído
 * pelas parcelas em ordem de vencimento: assim sabemos qual está paga,
 * qual está parcial e qual venceu.
 */

export interface Installment {
  id: string;
  description: string;
  amount: number;
  due_date: IsoDate;
}

export type InstallmentStatus = "paid" | "partial" | "overdue" | "due_today" | "upcoming";

export interface InstallmentProgress extends Installment {
  covered: number;
  remaining: number;
  status: InstallmentStatus;
}

export function allocatePayments(items: Installment[], paid: number, today: IsoDate): InstallmentProgress[] {
  let available = Math.max(roundMoney(paid), 0);

  return [...items]
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.description.localeCompare(b.description))
    .map((item) => {
      const covered = roundMoney(Math.min(available, item.amount));
      available = roundMoney(available - covered);
      const remaining = roundMoney(item.amount - covered);

      let status: InstallmentStatus;
      if (remaining <= 0) status = "paid";
      else if (item.due_date < today) status = "overdue";
      else if (item.due_date === today) status = "due_today";
      else status = covered > 0 ? "partial" : "upcoming";

      return { ...item, covered, remaining, status };
    });
}

/** Primeira parcela com valor em aberto (a próxima a cobrar). */
export function nextInstallment(progress: InstallmentProgress[]): InstallmentProgress | null {
  return progress.find((item) => item.remaining > 0) ?? null;
}

/** Quanto do total da reserva ainda não tem parcela (positivo) ou passou (negativo). */
export function unscheduledAmount(items: Installment[], total: number): number {
  return roundMoney(total - items.reduce((sum, item) => sum + item.amount, 0));
}

/** Sugestão rápida: sinal (padrão 50%) hoje e o resto no check-in. */
export function depositAndBalance(input: {
  total: number;
  checkIn: IsoDate;
  today: IsoDate;
  depositPercent?: number;
}): Omit<Installment, "id">[] {
  const percent = input.depositPercent ?? 50;
  const total = roundMoney(input.total);
  const deposit = roundMoney((total * percent) / 100);
  const balanceDue = input.checkIn > input.today ? input.checkIn : input.today;

  return [
    { description: `Sinal ${percent}%`, amount: deposit, due_date: input.today },
    { description: "Saldo no check-in", amount: roundMoney(total - deposit), due_date: balanceDue },
  ].filter((item) => item.amount > 0);
}

/** Data em que o saldo vence: a próxima parcela em aberto, ou o check-in se não houver parcelas. */
export function balanceDueDate(input: {
  items: Installment[];
  paid: number;
  checkIn: IsoDate;
  today: IsoDate;
}): IsoDate {
  if (input.items.length === 0) return input.checkIn;
  return nextInstallment(allocatePayments(input.items, input.paid, input.today))?.due_date ?? input.checkIn;
}
