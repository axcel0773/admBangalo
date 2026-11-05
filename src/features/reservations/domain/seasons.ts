import { addDays, daysBetween, type IsoDate } from "@/lib/dates";

import { roundMoney } from "./pricing";

/**
 * Tarifas por temporada (tabela chalet_rates). Cada noite usa a diária da temporada
 * em que cai; fora delas, a diária base do bangalô. A reserva guarda uma diária só,
 * então a prévia sugere a média das noites.
 */

export interface SeasonRate {
  id: string;
  chalet_id: string;
  label: string;
  /** Primeira noite da temporada. */
  start: IsoDate;
  /** Dia seguinte à última noite (fim exclusivo, como o daterange do Postgres). */
  end: IsoDate;
  nightly_rate: number;
  min_nights: number;
}

/** "[2026-12-20,2027-01-03)" (daterange do PostgREST) → { start, end } com fim exclusivo. */
export function parseDateRange(range: string): { start: IsoDate; end: IsoDate } | null {
  const match = /^([[(])(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})([\])])$/.exec(range.trim());
  if (!match) return null;
  const [, open, from = "", to = "", close] = match;
  return {
    start: open === "(" ? addDays(from, 1) : from,
    end: close === "]" ? addDays(to, 1) : to,
  };
}

/** Datas do formulário (última noite inclusive) → daterange canônico "[início,fim)". */
export function toDateRange(firstNight: IsoDate, lastNight: IsoDate): string {
  return `[${firstNight},${addDays(lastNight, 1)})`;
}

export interface NightlyBreakdownGroup {
  label: string | null;
  nights: number;
  rate: number;
}

export interface NightlyBreakdown {
  total: number;
  /** Média das noites, arredondada ao centavo (sugestão de diária). */
  average: number;
  /** Noites agrupadas por temporada, na ordem em que aparecem. */
  groups: NightlyBreakdownGroup[];
  /** Temporada cuja estadia mínima não foi atingida (aviso, não bloqueia). */
  minNightsIssue: { label: string; minNights: number } | null;
  /** Alguma noite caiu em temporada. */
  seasonal: boolean;
}

export function seasonFor(day: IsoDate, seasons: SeasonRate[]): SeasonRate | null {
  return seasons.find((season) => season.start <= day && day < season.end) ?? null;
}

export function nightlyBreakdown(input: {
  checkIn: IsoDate;
  checkOut: IsoDate;
  baseRate: number;
  seasons: SeasonRate[];
}): NightlyBreakdown | null {
  const nights = daysBetween(input.checkIn, input.checkOut);
  if (!(nights > 0)) return null;

  const groups: NightlyBreakdownGroup[] = [];
  const touched = new Map<string, SeasonRate>();
  let total = 0;

  for (let index = 0; index < nights; index++) {
    const season = seasonFor(addDays(input.checkIn, index), input.seasons);
    const rate = season?.nightly_rate ?? input.baseRate;
    const label = season?.label ?? null;
    total += rate;
    if (season) touched.set(season.id, season);

    const last = groups[groups.length - 1];
    if (last && last.label === label && last.rate === rate) last.nights += 1;
    else groups.push({ label, nights: 1, rate });
  }

  const strictest = [...touched.values()]
    .filter((season) => season.min_nights > nights)
    .sort((a, b) => b.min_nights - a.min_nights)[0];

  return {
    total: roundMoney(total),
    average: roundMoney(total / nights),
    groups,
    minNightsIssue: strictest ? { label: strictest.label, minNights: strictest.min_nights } : null,
    seasonal: touched.size > 0,
  };
}
