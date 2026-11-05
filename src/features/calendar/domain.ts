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

/** Datas bloqueadas (manutenção ou calendário externo), na grade e na agenda. */
export interface CalendarBlock {
  id: string;
  chalet_id: string;
  starts_on: IsoDate;
  ends_on: IsoDate;
  reason: string;
  source: Enums<"block_source">;
}

export interface CalendarBlockSegment {
  block: CalendarBlock;
  startIndex: number;
  span: number;
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
  blocks: CalendarBlockSegment[];
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

/** Posiciona o bloqueio nas colunas visíveis; null se não cruza o período. */
export function toBlockSegment(block: CalendarBlock, start: IsoDate, count: number): CalendarBlockSegment | null {
  const startIndex = Math.max(daysBetween(start, block.starts_on), 0);
  const endIndex = Math.min(daysBetween(start, block.ends_on), count);
  if (endIndex <= startIndex) return null;
  return { block, startIndex, span: endIndex - startIndex };
}

export function buildCalendarGrid(input: {
  chalets: CalendarChalet[];
  stays: CalendarStay[];
  blocks?: CalendarBlock[];
  start: IsoDate;
  days: number;
  today: IsoDate;
}): CalendarGrid {
  const active = input.stays.filter((stay) => stay.status !== "cancelled");
  const blocks = input.blocks ?? [];

  const rows = input.chalets.map((chalet) => {
    const segments = active
      .filter((stay) => stay.chalet_id === chalet.id)
      .map((stay) => toSegment(stay, input.start, input.days))
      .filter((segment): segment is CalendarSegment => segment !== null)
      .sort((a, b) => a.startIndex - b.startIndex);
    const blockSegments = blocks
      .filter((block) => block.chalet_id === chalet.id)
      .map((block) => toBlockSegment(block, input.start, input.days))
      .filter((segment): segment is CalendarBlockSegment => segment !== null);
    return {
      chalet,
      segments,
      blocks: blockSegments,
      occupiedNights: segments.reduce((sum, s) => sum + s.span, 0),
    };
  });

  return {
    days: buildDays(input.start, input.days, input.today),
    rows,
    occupiedNights: rows.reduce((sum, row) => sum + row.occupiedNights, 0),
    totalNights: input.chalets.length * input.days,
  };
}

/* ---------- Agenda de um dia (celular) ---------- */

export type ChaletDayState = "arriving" | "leaving" | "turnover" | "staying" | "blocked" | "free";

export interface ChaletDayEntry {
  chalet: CalendarChalet;
  state: ChaletDayState;
  /** Hóspede que chega ou está hospedado (ou quem sai, se o bangalô fica livre). */
  stay: CalendarStay | null;
  /** Quem sai no mesmo dia em que outro chega. */
  leavingStay: CalendarStay | null;
  /** Bloqueio que ocupa a noite (quando não há hóspede). */
  block: CalendarBlock | null;
}

export function buildDayAgenda(
  chalets: CalendarChalet[],
  stays: CalendarStay[],
  day: IsoDate,
  blocks: CalendarBlock[] = [],
): ChaletDayEntry[] {
  const active = stays.filter((stay) => stay.status !== "cancelled");

  return chalets.map((chalet) => {
    const own = active.filter((stay) => stay.chalet_id === chalet.id);
    const arriving = own.find((stay) => stay.check_in === day) ?? null;
    const leaving = own.find((stay) => stay.check_out === day) ?? null;
    const staying = own.find((stay) => stay.check_in < day && day < stay.check_out) ?? null;

    const block = blocks.find((b) => b.chalet_id === chalet.id && b.starts_on <= day && day < b.ends_on) ?? null;

    if (arriving && leaving) return { chalet, state: "turnover", stay: arriving, leavingStay: leaving, block: null };
    if (arriving) return { chalet, state: "arriving", stay: arriving, leavingStay: null, block: null };
    if (staying) return { chalet, state: "staying", stay: staying, leavingStay: null, block: null };
    if (block) return { chalet, state: "blocked", stay: leaving, leavingStay: null, block };
    if (leaving) return { chalet, state: "leaving", stay: leaving, leavingStay: null, block: null };
    return { chalet, state: "free", stay: null, leavingStay: null, block: null };
  });
}

/** Bangalôs ocupados na noite de `day`, para os pontinhos da semana. */
export function occupiedChaletIds(stays: CalendarStay[], day: IsoDate): string[] {
  return stays
    .filter((stay) => stay.status !== "cancelled" && stay.check_in <= day && day < stay.check_out)
    .map((stay) => stay.chalet_id);
}

/* ---------- Seletor de data (mês inteiro) ---------- */

export interface MonthCell {
  date: IsoDate;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

/** Semanas (domingo a sábado) que cobrem o mês de `month`, com os dias vizinhos completando as pontas. */
export function buildMonthGrid(month: IsoDate, today: IsoDate, selected: IsoDate | null): MonthCell[][] {
  const first = `${month.slice(0, 7)}-01`;
  const firstWeekday = new Date(`${first}T00:00:00Z`).getUTCDay();
  const gridStart = addDays(first, -firstWeekday);
  const nextMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const totalDays = daysBetween(gridStart, nextMonth);
  const weeks = Math.ceil(totalDays / 7);

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const date = addDays(gridStart, week * 7 + weekday);
      return {
        date,
        dayNumber: Number(date.slice(8)),
        inMonth: date.slice(0, 7) === month.slice(0, 7),
        isToday: date === today,
        isSelected: date === selected,
      };
    }),
  );
}

/** Primeiro dia do mês anterior/seguinte. */
export function shiftCalendarMonth(month: IsoDate, delta: number): IsoDate {
  const date = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1));
  return date.toISOString().slice(0, 10);
}
