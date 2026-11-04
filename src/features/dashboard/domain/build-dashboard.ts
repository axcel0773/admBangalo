import { balanceDueDate, type Installment } from "@/features/billing/domain/schedule";
import { paidAmount, roundMoney } from "@/features/reservations/domain";
import { addDays, daysBetween, daysInMonth, startOfMonth, type IsoDate } from "@/lib/dates";

import type {
  AgendaEvent,
  ChaletOverview,
  ChaletRow,
  DashboardData,
  DashboardSummary,
  PaymentRow,
  Receivable,
  StayRow,
  UpcomingArrival,
} from "./types";

/** "14:00:00" → "14:00" */
function hhmm(time: string): string {
  return time.slice(0, 5);
}

/** A estadia ocupa a noite de `day`? (check-out não ocupa) */
export function occupiesNight(stay: Pick<StayRow, "check_in" | "check_out">, day: IsoDate): boolean {
  return stay.check_in <= day && day < stay.check_out;
}

/** Noites de cada estadia que caem dentro do mês de `day`. */
export function nightsInMonth(stays: StayRow[], day: IsoDate): Map<string, number> {
  const monthStart = startOfMonth(day);
  const nextMonth = addDays(monthStart, daysInMonth(day));
  const perChalet = new Map<string, number>();

  for (const stay of stays) {
    const from = stay.check_in > monthStart ? stay.check_in : monthStart;
    const to = stay.check_out < nextMonth ? stay.check_out : nextMonth;
    const nights = Math.max(daysBetween(from, to), 0);
    perChalet.set(stay.chalet_id, (perChalet.get(stay.chalet_id) ?? 0) + nights);
  }
  return perChalet;
}

export function buildAgenda(stays: StayRow[], chalets: ChaletRow[], today: IsoDate): AgendaEvent[] {
  const chaletById = new Map(chalets.map((c) => [c.id, c]));
  const events: AgendaEvent[] = [];

  for (const stay of stays) {
    const chalet = chaletById.get(stay.chalet_id);
    const base = {
      reservationId: stay.reservation_id,
      guestName: stay.main_guest_name,
      chaletName: stay.chalet_name,
      chaletColor: chalet?.color ?? "#4A6B3A",
      guests: stay.guests_count,
    };
    if (stay.check_out === today) {
      events.push({ ...base, type: "check-out", time: hhmm(chalet?.check_out_time ?? "12:00") });
    }
    if (stay.check_in === today) {
      events.push({ ...base, type: "check-in", time: hhmm(chalet?.check_in_time ?? "14:00") });
    }
  }
  return events.sort((a, b) => a.time.localeCompare(b.time));
}

export function buildChaletOverview(
  chalets: ChaletRow[],
  stays: StayRow[],
  today: IsoDate,
  photoUrls: Record<string, string> = {},
): ChaletOverview[] {
  const monthNights = nightsInMonth(stays, today);
  const totalNights = daysInMonth(today);

  return chalets.map((chalet) => {
    const ownStays = stays.filter((s) => s.chalet_id === chalet.id);
    const arriving = ownStays.find((s) => s.check_in === today);
    const current = ownStays.find((s) => occupiesNight(s, today));
    const leaving = ownStays.find((s) => s.check_out === today);
    const focus = arriving ?? current ?? leaving ?? null;

    const status = arriving
      ? "arriving"
      : current
        ? "occupied"
        : leaving
          ? "leaving"
          : "free";

    return {
      id: chalet.id,
      name: chalet.name,
      color: chalet.color,
      photoUrl: chalet.photo_path ? (photoUrls[chalet.photo_path] ?? null) : null,
      maxGuests: chalet.max_guests,
      nightlyRate: chalet.base_nightly_rate,
      status,
      guestName: focus?.main_guest_name ?? null,
      guests: focus?.guests_count ?? 0,
      checkOut: focus?.check_out ?? null,
      monthOccupancy: (monthNights.get(chalet.id) ?? 0) / totalNights,
    };
  });
}

/** Parcelas previstas por reserva (tabela payment_schedule). */
export type SchedulesByReservation = Map<string, Installment[]>;

export function buildReceivables(
  open: StayRow[],
  today: IsoDate,
  schedules: SchedulesByReservation = new Map(),
): Receivable[] {
  return open
    .map((stay): Receivable => {
      // Vence na próxima parcela em aberto; sem parcelas, no check-in.
      const dueDate = balanceDueDate({
        items: schedules.get(stay.reservation_id) ?? [],
        paid: stay.paid_total,
        checkIn: stay.check_in,
        today,
      });
      return {
        reservationId: stay.reservation_id,
        guestName: stay.main_guest_name,
        chaletName: stay.chalet_name,
        amount: stay.balance_due,
        dueDate,
        dueStatus: dueDate < today ? "overdue" : dueDate === today ? "today" : "upcoming",
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function buildUpcoming(stays: StayRow[]): UpcomingArrival[] {
  return stays.map((stay) => ({
    reservationId: stay.reservation_id,
    guestName: stay.main_guest_name,
    chaletName: stay.chalet_name,
    checkIn: stay.check_in,
    checkOut: stay.check_out,
    nights: stay.nights,
    guests: stay.guests_count,
    total: stay.grand_total,
    paymentStatus: stay.payment_status,
  }));
}

export function buildSummary(input: {
  chalets: ChaletRow[];
  monthStays: StayRow[];
  openBalances: StayRow[];
  monthPayments: PaymentRow[];
  today: IsoDate;
  schedules?: SchedulesByReservation;
}): DashboardSummary {
  const { chalets, monthStays, openBalances, monthPayments, today } = input;

  const nightsAvailable = chalets.length * daysInMonth(today);
  const nightsSold = [...nightsInMonth(monthStays, today).values()].reduce((a, b) => a + b, 0);
  const receivables = buildReceivables(openBalances, today, input.schedules);

  return {
    occupancyRate: nightsAvailable > 0 ? nightsSold / nightsAvailable : 0,
    nightsSold,
    nightsAvailable,
    receivableTotal: roundMoney(receivables.reduce((sum, r) => sum + r.amount, 0)),
    receivableCount: receivables.length,
    dueNowCount: receivables.filter((r) => r.dueStatus !== "upcoming").length,
    receivedThisMonth: paidAmount(monthPayments),
    paymentsThisMonth: monthPayments.filter((p) => p.kind !== "refund").length,
    pixPaymentsThisMonth: monthPayments.filter((p) => p.kind !== "refund" && p.method === "pix")
      .length,
    guestsToday: monthStays
      .filter((s) => occupiesNight(s, today))
      .reduce((sum, s) => sum + s.guests_count, 0),
  };
}

/** Monta o Painel a partir das consultas. Função pura: fácil de testar. */
export function buildDashboard(input: {
  today: IsoDate;
  chalets: ChaletRow[];
  monthStays: StayRow[];
  openBalances: StayRow[];
  monthPayments: PaymentRow[];
  upcoming: StayRow[];
  schedules?: SchedulesByReservation;
  /** Links assinados das fotos, por caminho no Storage. */
  photoUrls?: Record<string, string>;
  receivablesLimit?: number;
}): DashboardData {
  const { today, chalets, monthStays, openBalances, monthPayments, upcoming, schedules } = input;

  return {
    today,
    summary: buildSummary({ chalets, monthStays, openBalances, monthPayments, today, schedules }),
    agenda: buildAgenda(monthStays, chalets, today),
    chalets: buildChaletOverview(chalets, monthStays, today, input.photoUrls),
    receivables: buildReceivables(openBalances, today, schedules).slice(0, input.receivablesLimit ?? 4),
    upcoming: buildUpcoming(upcoming),
  };
}
