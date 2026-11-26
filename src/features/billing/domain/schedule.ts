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

/**
 * Diferença que não conta como dívida: parcela de R$ 3.500,01 paga com R$ 3.500,00 fica "paga".
 * Evita "vencida por R$ 0,01" quando a conta da diária deixou centavos.
 */
export const CENTS_TOLERANCE = 1;

export function allocatePayments(items: Installment[], paid: number, today: IsoDate): InstallmentProgress[] {
  let available = Math.max(roundMoney(paid), 0);

  return [...items]
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.description.localeCompare(b.description))
    .map((item) => {
      const covered = roundMoney(Math.min(available, item.amount));
      available = roundMoney(available - covered);
      const remaining = roundMoney(item.amount - covered);

      let status: InstallmentStatus;
      if (remaining <= 0 || (covered > 0 && remaining <= CENTS_TOLERANCE)) status = "paid";
      else if (item.due_date < today) status = "overdue";
      else if (item.due_date === today) status = "due_today";
      else status = covered > 0 ? "partial" : "upcoming";

      return { ...item, covered, remaining, status };
    });
}

/** Primeira parcela com valor em aberto (a próxima a cobrar). */
export function nextInstallment(progress: InstallmentProgress[]): InstallmentProgress | null {
  return progress.find((item) => item.status !== "paid") ?? null;
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
  /** Já recebido antes de existirem parcelas: vira "Sinal (pago)" e só o resto é dividido. */
  paid?: number;
  /** Data do primeiro pagamento (vencimento do sinal pago). */
  paidOn?: IsoDate;
}): Omit<Installment, "id">[] {
  const { count, today } = input;
  const totalCents = Math.max(Math.round(roundMoney(input.total) * 100), 0);
  const paidCents = Math.min(Math.max(Math.round(roundMoney(input.paid ?? 0) * 100), 0), totalCents);
  const cents = totalCents - paidCents;
  const lastDue = input.checkIn > today ? input.checkIn : today;
  const span = daysBetween(today, lastDue);
  const hasPaid = paidCents > 0;

  const base = input.wholeReais ? Math.floor(cents / 100 / count) * 100 : Math.floor(cents / count);
  const leftover = cents - base * count;

  const rest = Array.from({ length: count }, (_, index) => {
    const extra = input.wholeReais ? (index === 0 ? leftover : 0) : index < leftover ? 1 : 0;
    const amountCents = base + extra;
    // Com sinal já pago, as divididas são "Parcela 2…" e vencem depois de hoje; sem ele, a 1ª é o sinal de hoje.
    const description =
      index === count - 1
        ? "Saldo no check-in"
        : hasPaid
          ? `Parcela ${index + 2}`
          : index === 0
            ? "Sinal"
            : `Parcela ${index + 1}`;
    const step = hasPaid ? (span * (index + 1)) / count : (span * index) / (count - 1);
    return { description, amount: amountCents / 100, due_date: addDays(today, Math.round(step)) };
  }).filter((item) => item.amount > 0);

  if (!hasPaid) return rest;
  return [{ description: "Sinal (pago)", amount: paidCents / 100, due_date: input.paidOn ?? today }, ...rest];
}

export type ScheduleGapFix =
  /** Pagamento recebido sem parcela: vira "Sinal (pago)" na data do 1º pagamento. */
  | { kind: "paid_deposit"; amount: number }
  /** Somar a diferença (ou tirar, se negativa) da última parcela. */
  | { kind: "adjust_last"; amount: number; installmentId: string; newAmount: number }
  /** Nova parcela com a diferença, no check-in. */
  | { kind: "new_installment"; amount: number };

/**
 * Consertos possíveis quando as parcelas não somam o total. O mais provável vem primeiro:
 * se já há pagamento que cobre a diferença, ela é o sinal que foi pago sem parcela.
 */
export function scheduleGapFixes(input: { items: Installment[]; total: number; paid: number }): ScheduleGapFix[] {
  const gap = unscheduledAmount(input.items, input.total);
  if (gap === 0 || input.items.length === 0) return [];
  const fixes: ScheduleGapFix[] = [];
  if (gap > 0 && input.paid >= gap) fixes.push({ kind: "paid_deposit", amount: gap });

  const last = [...input.items].sort((a, b) => b.due_date.localeCompare(a.due_date))[0];
  const newAmount = last ? roundMoney(last.amount + gap) : 0;
  if (last && newAmount > 0) fixes.push({ kind: "adjust_last", amount: gap, installmentId: last.id, newAmount });

  if (gap > 0) fixes.push({ kind: "new_installment", amount: gap });
  return fixes;
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
