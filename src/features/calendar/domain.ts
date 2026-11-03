import { addDays, daysBetween, type IsoDate } from "@/lib/dates";
import type { Enums } from "@/types/database";

export interface CalendarChalet {
  id: string;
  name: string;
  color: string;
  max_guests: number;
}

export interface CalendarStay {
  reservation_id: string;
  chalet_id: string;
  main_guest_name: string;
  check_in: IsoDate;
  check_out: IsoDate;
  guests_count: number;
  status: Enums<"reservation_status">;
  payment_status: "cancelled" | "unpaid" | "partial" | "paid";
  balance_due: number;
}

export interface CalendarDay {
  date: IsoDate;
  weekday: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
}

/** Barra de uma reserva na grade: ocupa as noites [startIndex, startIndex + span). */
export interface CalendarSegment {
  stay: CalendarStay;
  startIndex: number;
  span: number;
  /** A estadia começou antes da primeira coluna visível. */
  continuesFromBefore: boolean;
  /** A estadia segue depois da última coluna visível. */
  continuesAfter: boolean;
}

export interface CalendarRow {
  chalet: CalendarChalet;
  segments: CalendarSegment[];
  occupiedNights: number;
}

export interface CalendarGrid {
  days: CalendarDay[];
  rows: CalendarRow[];
  occupiedNights: number;
  totalNights: number;
}

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

export function buildDays(start: IsoDate, count: number, today: IsoDate): CalendarDay[] {
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(start, index);
    const utc = new Date(`${date}T00:00:00Z`);
    const weekdayIndex = utc.getUTCDay();
    return {
      date,
      weekday: weekdayFormatter.format(utc).replace(".", ""),
      dayNumber: utc.getUTCDate(),
      isToday: date === today,
      isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
    };
  });
}

/** Posiciona a estadia nas colunas visíveis; null se não cruza o período. */
export function toSegment(stay: CalendarStay, start: IsoDate, count: number): CalendarSegment | null {
  const from = daysBetween(start, stay.check_in);
  const to = daysBetween(start, stay.check_out); // noite do check-out não conta
  const startIndex = Math.max(from, 0);
  const endIndex = Math.min(to, count);
  if (endIndex <= startIndex) return null;
  return {
    stay,
    startIndex,
    span: endIndex - startIndex,
    continuesFromBefore: from < 0,
    continuesAfter: to > count,
  };
}

export function buildCalendarGrid(input: {
  chalets: CalendarChalet[];
  stays: CalendarStay[];
  start: IsoDate;
  days: number;
  today: IsoDate;
}): CalendarGrid {
  const active = input.stays.filter((stay) => stay.status !== "cancelled");

  const rows = input.chalets.map((chalet) => {
    const segments = active
      .filter((stay) => stay.chalet_id === chalet.id)
      .map((stay) => toSegment(stay, input.start, input.days))
      .filter((segment): segment is CalendarSegment => segment !== null)
      .sort((a, b) => a.startIndex - b.startIndex);
    return { chalet, segments, occupiedNights: segments.reduce((sum, s) => sum + s.span, 0) };
  });

  return {
    days: buildDays(input.start, input.days, input.today),
    rows,
    occupiedNights: rows.reduce((sum, row) => sum + row.occupiedNights, 0),
    totalNights: input.chalets.length * input.days,
  };
}

/* ---------- Agenda de um dia (celular) ---------- */

export type ChaletDayState = "arriving" | "leaving" | "turnover" | "staying" | "free";

export interface ChaletDayEntry {
  chalet: CalendarChalet;
  state: ChaletDayState;
  /** Hóspede que chega ou está hospedado (ou quem sai, se o chalé fica livre). */
  stay: CalendarStay | null;
  /** Quem sai no mesmo dia em que outro chega. */
  leavingStay: CalendarStay | null;
}

export function buildDayAgenda(chalets: CalendarChalet[], stays: CalendarStay[], day: IsoDate): ChaletDayEntry[] {
  const active = stays.filter((stay) => stay.status !== "cancelled");

  return chalets.map((chalet) => {
    const own = active.filter((stay) => stay.chalet_id === chalet.id);
    const arriving = own.find((stay) => stay.check_in === day) ?? null;
    const leaving = own.find((stay) => stay.check_out === day) ?? null;
    const staying = own.find((stay) => stay.check_in < day && day < stay.check_out) ?? null;

    if (arriving && leaving) return { chalet, state: "turnover", stay: arriving, leavingStay: leaving };
    if (arriving) return { chalet, state: "arriving", stay: arriving, leavingStay: null };
    if (staying) return { chalet, state: "staying", stay: staying, leavingStay: null };
    if (leaving) return { chalet, state: "leaving", stay: leaving, leavingStay: null };
    return { chalet, state: "free", stay: null, leavingStay: null };
  });
}

/** Chalés ocupados na noite de `day`, para os pontinhos da semana. */
export function occupiedChaletIds(stays: CalendarStay[], day: IsoDate): string[] {
  return stays
    .filter((stay) => stay.status !== "cancelled" && stay.check_in <= day && day < stay.check_out)
    .map((stay) => stay.chalet_id);
}
