import { daysBetween, type IsoDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

import type { QuoteRow, Receivable, StayRow, TodayAction } from "./types";

/** Quantos dias à frente uma chegada sem pagamento ou um orçamento a vencer entram na lista. */
export const ACTION_HORIZON_DAYS = 2;

const SEVERITY_ORDER = { danger: 0, warning: 1, info: 2 } as const;

function inDays(days: number): string {
  if (days <= 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

/**
 * O que precisa de atenção hoje, do mais urgente ao menos:
 * saldos vencidos (ou que vencem hoje), chegadas próximas sem nenhum pagamento e orçamentos a vencer.
 * Uma reserva aparece uma vez só (saldo vencido tem prioridade sobre "sem pagamento").
 */
export function buildTodayActions(input: {
  today: IsoDate;
  receivables: Receivable[];
  stays: StayRow[];
  quotes: QuoteRow[];
  limit?: number;
}): TodayAction[] {
  const { today, receivables, stays, quotes } = input;
  const actions: TodayAction[] = [];
  const handled = new Set<string>();

  for (const item of receivables) {
    if (item.dueStatus === "upcoming") continue;
    handled.add(item.reservationId);
    const late = item.dueStatus === "overdue";
    actions.push({
      id: `balance-${item.reservationId}`,
      type: "overdue-balance",
      severity: late ? "danger" : "warning",
      title: late ? `Saldo vencido · ${item.guestName}` : `Saldo vence hoje · ${item.guestName}`,
      subtitle: `${formatCurrency(item.amount)} · ${item.chaletName}`,
      target: { kind: "reservation", id: item.reservationId },
      date: item.dueDate,
    });
  }

  const seenStays = new Set<string>();
  for (const stay of stays) {
    if (seenStays.has(stay.reservation_id)) continue;
    seenStays.add(stay.reservation_id);
    const days = daysBetween(today, stay.check_in);
    if (stay.status === "cancelled" || days < 0 || days > ACTION_HORIZON_DAYS) continue;
    if (stay.paid_total > 0 || handled.has(stay.reservation_id)) continue;
    actions.push({
      id: `unpaid-${stay.reservation_id}`,
      type: "arrival-unpaid",
      severity: "warning",
      title: `Chega ${inDays(days)} sem pagamento · ${stay.main_guest_name}`,
      subtitle: `${formatCurrency(stay.grand_total)} · ${stay.chalet_name}`,
      target: { kind: "reservation", id: stay.reservation_id },
      date: stay.check_in,
    });
  }

  for (const quote of quotes) {
    const days = daysBetween(today, quote.valid_until);
    if (days < 0 || days > ACTION_HORIZON_DAYS) continue;
    actions.push({
      id: `quote-${quote.id}`,
      type: "quote-expiring",
      severity: "info",
      title: `Orçamento vence ${inDays(days)} · ${quote.guest_name}`,
      subtitle: "Acompanhe com o hóspede ou crie a reserva",
      target: { kind: "quote", id: quote.id },
      date: quote.valid_until,
    });
  }

  return actions
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        a.date.localeCompare(b.date) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, input.limit ?? 6);
}
