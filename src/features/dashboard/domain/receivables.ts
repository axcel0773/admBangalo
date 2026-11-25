import { formatShortDate, type IsoDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

import { buildReceivables, type SchedulesByReservation } from "./build-dashboard";
import type { Receivable, StayRow } from "./types";

/** Tela "A receber": todos os saldos em aberto, com o que precisa para cobrar. */

export const RECEIVABLE_FILTERS = {
  all: "Todas",
  overdue: "Vencidas",
  today: "Vencem hoje",
  upcoming: "Próximas",
} as const;

export type ReceivableFilter = keyof typeof RECEIVABLE_FILTERS;
export type ReceivableStatus = Receivable["dueStatus"];

export function isReceivableFilter(value: string | undefined): value is ReceivableFilter {
  return value !== undefined && Object.hasOwn(RECEIVABLE_FILTERS, value);
}

export interface ReceivableDetail extends Receivable {
  checkIn: IsoDate;
  checkOut: IsoDate;
  total: number;
  paid: number;
  /** Telefone do hóspede principal (para o WhatsApp), se cadastrado. */
  phone: string | null;
}

/** Junta o vencimento calculado (parcelas ou check-in) com os dados da estadia e o telefone. */
export function buildReceivableDetails(
  open: StayRow[],
  today: IsoDate,
  schedules: SchedulesByReservation,
  phones: Map<string, string | null>,
): ReceivableDetail[] {
  const stays = new Map(open.map((stay) => [stay.reservation_id, stay]));
  return buildReceivables(open, today, schedules).map((item) => {
    const stay = stays.get(item.reservationId);
    return {
      ...item,
      checkIn: stay?.check_in ?? item.dueDate,
      checkOut: stay?.check_out ?? item.dueDate,
      total: stay?.grand_total ?? item.amount,
      paid: stay?.paid_total ?? 0,
      phone: phones.get(item.reservationId) ?? null,
    };
  });
}

const round = (value: number) => Math.round(value * 100) / 100;

export interface ReceivablesSummary {
  total: number;
  count: number;
  byStatus: Record<ReceivableStatus, { total: number; count: number }>;
}

export function summarizeReceivables(items: Receivable[]): ReceivablesSummary {
  const byStatus: ReceivablesSummary["byStatus"] = {
    overdue: { total: 0, count: 0 },
    today: { total: 0, count: 0 },
    upcoming: { total: 0, count: 0 },
  };
  for (const item of items) {
    byStatus[item.dueStatus].total = round(byStatus[item.dueStatus].total + item.amount);
    byStatus[item.dueStatus].count += 1;
  }
  return { total: round(items.reduce((sum, item) => sum + item.amount, 0)), count: items.length, byStatus };
}

const GROUP_ORDER: ReceivableStatus[] = ["overdue", "today", "upcoming"];

export interface ReceivableGroup<T extends Receivable> {
  status: ReceivableStatus;
  label: string;
  total: number;
  items: T[];
}

/** Vencidas, depois as que vencem hoje, depois as próximas; cada grupo com subtotal. */
export function groupReceivables<T extends Receivable>(items: T[], filter: ReceivableFilter = "all"): ReceivableGroup<T>[] {
  return GROUP_ORDER.filter((status) => filter === "all" || filter === status)
    .map((status) => {
      const own = items.filter((item) => item.dueStatus === status);
      return { status, label: RECEIVABLE_FILTERS[status], total: round(own.reduce((sum, item) => sum + item.amount, 0)), items: own };
    })
    .filter((group) => group.items.length > 0);
}

export function dueLabel({ dueStatus, dueDate }: Pick<Receivable, "dueStatus" | "dueDate">): string {
  if (dueStatus === "today") return "vence hoje";
  if (dueStatus === "overdue") return `venceu ${formatShortDate(dueDate)}`;
  return `vence ${formatShortDate(dueDate)}`;
}

/** Cobrança educada para o WhatsApp, com o valor e, se houver, a chave Pix. Sem emoji. */
export function receivableMessage(input: {
  item: ReceivableDetail;
  businessName: string;
  pixKey: string | null;
}): string {
  const { item } = input;
  const firstName = item.guestName.trim().split(/\s+/)[0] || item.guestName;
  const lines = [
    `Olá, ${firstName}! Tudo bem? Passando para lembrar do saldo da sua reserva no ${item.chaletName}.`,
    "",
    `Estadia: ${formatShortDate(item.checkIn)} a ${formatShortDate(item.checkOut)}`,
    `Valor em aberto: ${formatCurrency(item.amount)} (${dueLabel(item)})`,
  ];
  if (input.pixKey) lines.push(`Chave Pix: ${input.pixKey}`);
  lines.push("", `Se já pagou, desconsidere e me avise para eu conferir. Obrigado! ${input.businessName}`);
  return lines.join("\n").replace(/ /g, " ");
}
