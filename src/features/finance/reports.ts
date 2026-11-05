import { SOURCE_LABELS, type ReservationSource } from "@/features/reservations/domain/status";
import { csvNumber, toCsv } from "@/lib/csv";
import { daysBetween, type IsoDate } from "@/lib/dates";

import { formatShortMonth, nightsInMonth, shiftMonth } from "./domain";

/** Relatório anual: ocupação, diária média e origem das reservas. */

export interface ReportStay {
  reservation_id: string;
  chalet_name: string;
  check_in: IsoDate;
  check_out: IsoDate;
  nights: number;
  lodging_total: number;
  source: ReservationSource;
}

export interface ReportMonthRow {
  month: IsoDate;
  label: string;
  nightsSold: number;
  nightsAvailable: number;
  /** 0–1 */
  occupancy: number;
  /** Hospedagem proporcional às noites do mês. */
  revenue: number;
  /** Diária média = receita ÷ noites vendidas. */
  averageRate: number;
}

export interface ReportSourceRow {
  source: ReservationSource;
  label: string;
  reservations: number;
  revenue: number;
}

export interface ReportChaletRow {
  name: string;
  nightsSold: number;
  occupancy: number;
  revenue: number;
}

export interface YearReport {
  year: number;
  months: ReportMonthRow[];
  totals: Omit<ReportMonthRow, "month" | "label">;
  sources: ReportSourceRow[];
  chalets: ReportChaletRow[];
}

export function parseYearParam(param: string | undefined, today: IsoDate): number {
  if (param && /^\d{4}$/.test(param)) {
    const year = Number(param);
    if (year >= 2000 && year <= 2100) return year;
  }
  return Number(today.slice(0, 4));
}

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
const round2 = (value: number) => Math.round(value * 100) / 100;

function overlapNights(stay: ReportStay, from: IsoDate, to: IsoDate): number {
  const start = stay.check_in > from ? stay.check_in : from;
  const end = stay.check_out < to ? stay.check_out : to;
  return Math.max(daysBetween(start, end), 0);
}

export function buildYearReport(input: { year: number; stays: ReportStay[]; chaletNames: string[] }): YearReport {
  const { year, stays } = input;
  const chaletCount = input.chaletNames.length;
  const yearStart = `${year}-01-01`;
  const nextYear = `${year + 1}-01-01`;

  const months: ReportMonthRow[] = Array.from({ length: 12 }, (_, index) => {
    const month = shiftMonth(yearStart, index);
    const available = daysBetween(month, shiftMonth(month, 1)) * chaletCount;
    let nights = 0;
    let revenue = 0;
    for (const stay of stays) {
      const inMonth = nightsInMonth(stay, month);
      nights += inMonth;
      revenue += stay.nights > 0 ? (stay.lodging_total * inMonth) / stay.nights : 0;
    }
    return {
      month,
      label: formatShortMonth(month),
      nightsSold: nights,
      nightsAvailable: available,
      occupancy: ratio(nights, available),
      revenue: round2(revenue),
      averageRate: round2(ratio(revenue, nights)),
    };
  });

  const nightsSold = months.reduce((sum, row) => sum + row.nightsSold, 0);
  const nightsAvailable = months.reduce((sum, row) => sum + row.nightsAvailable, 0);
  const revenue = round2(months.reduce((sum, row) => sum + row.revenue, 0));

  const sourceMap = new Map<ReservationSource, ReportSourceRow>();
  for (const stay of stays) {
    // Origem conta pela entrada: a reserva pertence ao ano do check-in.
    if (stay.check_in < yearStart || stay.check_in >= nextYear) continue;
    const row = sourceMap.get(stay.source) ?? {
      source: stay.source,
      label: SOURCE_LABELS[stay.source],
      reservations: 0,
      revenue: 0,
    };
    row.reservations += 1;
    row.revenue = round2(row.revenue + stay.lodging_total);
    sourceMap.set(stay.source, row);
  }

  const daysInYear = daysBetween(yearStart, nextYear);
  const chalets = input.chaletNames.map((name): ReportChaletRow => {
    const own = stays.filter((stay) => stay.chalet_name === name);
    const nights = own.reduce((sum, stay) => sum + overlapNights(stay, yearStart, nextYear), 0);
    const chaletRevenue = own.reduce(
      (sum, stay) => sum + (stay.nights > 0 ? (stay.lodging_total * overlapNights(stay, yearStart, nextYear)) / stay.nights : 0),
      0,
    );
    return { name, nightsSold: nights, occupancy: ratio(nights, daysInYear), revenue: round2(chaletRevenue) };
  });

  return {
    year,
    months,
    totals: {
      nightsSold,
      nightsAvailable,
      occupancy: ratio(nightsSold, nightsAvailable),
      revenue,
      averageRate: round2(ratio(revenue, nightsSold)),
    },
    sources: [...sourceMap.values()].sort((a, b) => b.reservations - a.reservations),
    chalets: chalets.sort((a, b) => b.revenue - a.revenue),
  };
}

const percent = (value: number) => `${(value * 100).toFixed(1).replace(".", ",")}%`;

/** CSV do ano: uma linha por mês e uma de total. */
export function yearReportCsv(report: YearReport): string {
  const row = (label: string, data: Omit<ReportMonthRow, "month" | "label">) => [
    label,
    data.nightsSold,
    data.nightsAvailable,
    percent(data.occupancy),
    csvNumber(data.revenue),
    csvNumber(data.averageRate),
  ];
  return toCsv(
    ["Mês", "Noites vendidas", "Noites disponíveis", "Ocupação", "Hospedagem (R$)", "Diária média (R$)"],
    [...report.months.map((month) => row(month.label, month)), row("Total", report.totals)],
  );
}
