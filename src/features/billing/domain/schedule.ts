import { roundMoney } from "@/features/reservations/domain";
import { addDays, daysBetween, type IsoDate } from "@/lib/dates";

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

/** Em quantas vezes o total pode ser dividido de uma vez (sinal + parcelas + saldo). */
export const SPLIT_COUNTS = [2, 3, 4] as const;
export type SplitCount = (typeof SPLIT_COUNTS)[number];

export function isSplitCount(value: number): value is SplitCount {
  return (SPLIT_COUNTS as readonly number[]).includes(value);
}

/**
 * Divide o total em parcelas iguais: sinal hoje, saldo no check-in e as do meio espaçadas entre as duas datas.
 * - `wholeReais`: parcelas em reais inteiros (R$ 1.250 em 3x = 418 + 416 + 416); a sobra fica no sinal.
 * - sem `wholeReais`: divide até o centavo; os centavos que sobram vão um a um para as primeiras (416,67 + 416,67 + 416,66).
 * Nos dois casos a soma é exatamente o total.
 */
export function splitPlan(input: {
  total: number;
  count: SplitCount;
  checkIn: IsoDate;
  today: IsoDate;
  wholeReais: boolean;
}): Omit<Installment, "id">[] {
  const { count, today } = input;
  const cents = Math.max(Math.round(roundMoney(input.total) * 100), 0);
  const lastDue = input.checkIn > today ? input.checkIn : today;
  const span = daysBetween(today, lastDue);

  const base = input.wholeReais ? Math.floor(cents / 100 / count) * 100 : Math.floor(cents / count);
  const leftover = cents - base * count;

  return Array.from({ length: count }, (_, index) => {
    const extra = input.wholeReais ? (index === 0 ? leftover : 0) : index < leftover ? 1 : 0;
    const amountCents = base + extra;
    const description = index === 0 ? "Sinal" : index === count - 1 ? "Saldo no check-in" : `Parcela ${index + 1}`;
    return {
      description,
      amount: amountCents / 100,
      due_date: addDays(today, Math.round((span * index) / (count - 1))),
    };
  }).filter((item) => item.amount > 0);
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
