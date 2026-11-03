import { roundMoney } from "@/features/reservations/domain";
import { addDays, daysBetween, daysInMonth, startOfMonth, type IsoDate } from "@/lib/dates";
import type { Enums, Views } from "@/types/database";

/**
 * Regras do Financeiro. Receita por competência = mês do check-in
 * (mesma regra da view monthly_summary); caixa = pagamentos pela data em que entraram.
 */

export type FinanceStay = Pick<
  Views<"reservation_financials">,
  | "reservation_id"
  | "chalet_name"
  | "main_guest_name"
  | "check_in"
  | "check_out"
  | "nights"
  | "guests_count"
  | "status"
  | "lodging_total"
  | "charges_total"
  | "energy_total"
  | "cleaning_total"
  | "grand_total"
  | "paid_total"
  | "balance_due"
  | "payment_status"
>;

export interface CashPayment {
  amount: number;
  kind: Enums<"payment_kind">;
  method: Enums<"payment_method">;
  paid_at: IsoDate;
}

export interface MonthSummaryRow {
  month: IsoDate;
  revenue_expected: number;
  revenue_received: number;
}

// ---- Meses -----------------------------------------------------------------

/** "?mes=2026-11" → "2026-11-01"; valor ausente ou inválido = mês de hoje. */
export function parseMonthParam(param: string | undefined, today: IsoDate): IsoDate {
  if (param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param)) return `${param}-01`;
  return startOfMonth(today);
}

/** "2026-11-01" → "2026-11" (formato do parâmetro de URL). */
export function monthParam(month: IsoDate): string {
  return month.slice(0, 7);
}

export function shiftMonth(month: IsoDate, delta: number): IsoDate {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1 + delta;
  const date = new Date(Date.UTC(year, index, 1));
  return date.toISOString().slice(0, 10);
}

export function endOfMonth(month: IsoDate): IsoDate {
  return addDays(month, daysInMonth(month) - 1);
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

/** "novembro de 2026" */
export function formatMonth(month: IsoDate): string {
  return monthFormatter.format(new Date(`${month}T00:00:00Z`));
}

/** "nov" */
export function formatShortMonth(month: IsoDate): string {
  return shortMonthFormatter.format(new Date(`${month}T00:00:00Z`)).replace(".", "");
}

/** Noites da estadia que caem dentro do mês. */
export function nightsInMonth(stay: { check_in: IsoDate; check_out: IsoDate }, month: IsoDate): number {
  const from = stay.check_in > month ? stay.check_in : month;
  const nextMonth = shiftMonth(month, 1);
  const to = stay.check_out < nextMonth ? stay.check_out : nextMonth;
  return Math.max(daysBetween(from, to), 0);
}

// ---- Relatório do mês --------------------------------------------------------

export interface MonthReport {
  month: IsoDate;
  /** Reservas com check-in no mês (sem canceladas). */
  stays: FinanceStay[];
  expected: number;
  received: number;
  pending: number;
  lodging: number;
  cleaning: number;
  energy: number;
  otherCharges: number;
  nightsSold: number;
  /** Noites ocupadas ÷ noites disponíveis (chalés ativos × dias do mês). */
  occupancy: number;
  /** Entradas de caixa no mês (pagamentos − estornos), por data de pagamento. */
  cashIn: number;
  cashByMethod: Partial<Record<Enums<"payment_method">, number>>;
}

const sum = <T>(items: T[], pick: (item: T) => number) => roundMoney(items.reduce((total, item) => total + pick(item), 0));

export function buildMonthReport(input: {
  month: IsoDate;
  /** Estadias que tocam o mês (podem começar antes). */
  stays: FinanceStay[];
  payments: CashPayment[];
  activeChalets: number;
}): MonthReport {
  const { month } = input;
  const active = input.stays.filter((stay) => stay.status !== "cancelled");
  const nextMonth = shiftMonth(month, 1);
  const stays = active
    .filter((stay) => stay.check_in >= month && stay.check_in < nextMonth)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

  const charges = sum(stays, (stay) => stay.charges_total);
  const energy = sum(stays, (stay) => stay.energy_total);
  const cleaning = sum(stays, (stay) => stay.cleaning_total);

  const nightsSold = active.reduce((total, stay) => total + nightsInMonth(stay, month), 0);
  const available = input.activeChalets * daysInMonth(month);

  const cashByMethod: MonthReport["cashByMethod"] = {};
  for (const payment of input.payments) {
    const signed = payment.kind === "refund" ? -payment.amount : payment.amount;
    cashByMethod[payment.method] = roundMoney((cashByMethod[payment.method] ?? 0) + signed);
  }

  return {
    month,
    stays,
    expected: sum(stays, (stay) => stay.grand_total),
    received: sum(stays, (stay) => stay.paid_total),
    pending: sum(stays, (stay) => Math.max(stay.balance_due, 0)),
    lodging: sum(stays, (stay) => stay.lodging_total),
    cleaning,
    energy,
    otherCharges: roundMoney(charges - energy - cleaning),
    nightsSold,
    occupancy: available > 0 ? Math.min(nightsSold / available, 1) : 0,
    cashIn: sum(input.payments, (payment) => (payment.kind === "refund" ? -payment.amount : payment.amount)),
    cashByMethod,
  };
}

// ---- Tendência ---------------------------------------------------------------

export interface TrendPoint {
  month: IsoDate;
  label: string;
  expected: number;
  received: number;
}

/** Últimos `count` meses até `month`, com zero nos meses sem reserva. */
export function buildTrend(rows: MonthSummaryRow[], month: IsoDate, count = 6): TrendPoint[] {
  const byMonth = new Map(rows.map((row) => [row.month.slice(0, 7), row]));
  return Array.from({ length: count }, (_, index) => {
    const current = shiftMonth(month, index - count + 1);
    const row = byMonth.get(current.slice(0, 7));
    return {
      month: current,
      label: formatShortMonth(current),
      expected: roundMoney(row?.revenue_expected ?? 0),
      received: roundMoney(row?.revenue_received ?? 0),
    };
  });
}

// ---- CSV ---------------------------------------------------------------------

const CSV_HEADER = [
  "Check-in",
  "Check-out",
  "Noites",
  "Pessoas",
  "Chalé",
  "Hóspede",
  "Hospedagem",
  "Limpeza",
  "Energia",
  "Outras taxas",
  "Total",
  "Pago",
  "Saldo",
];

/** Número no formato do Excel brasileiro (vírgula decimal, sem milhar). */
const csvNumber = (value: number) => value.toFixed(2).replace(".", ",");

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const brDate = (iso: IsoDate) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** CSV do mês com `;` (abre direto no Excel em português). */
export function financeCsv(report: Pick<MonthReport, "stays">): string {
  const lines = report.stays.map((stay) =>
    [
      brDate(stay.check_in),
      brDate(stay.check_out),
      stay.nights,
      stay.guests_count,
      stay.chalet_name,
      stay.main_guest_name,
      csvNumber(stay.lodging_total),
      csvNumber(stay.cleaning_total),
      csvNumber(stay.energy_total),
      csvNumber(roundMoney(stay.charges_total - stay.energy_total - stay.cleaning_total)),
      csvNumber(stay.grand_total),
      csvNumber(stay.paid_total),
      csvNumber(stay.balance_due),
    ]
      .map(csvCell)
      .join(";"),
  );
  return [CSV_HEADER.join(";"), ...lines].join("\r\n");
}
