/**
 * Datas de calendário (sem hora) trafegam como string ISO "YYYY-MM-DD",
 * igual às colunas `date` do Postgres. Assim evitamos erros de fuso.
 */
export type IsoDate = string;

export const APP_TIME_ZONE = "America/Sao_Paulo";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export function isIsoDate(value: string): value is IsoDate {
  return ISO_DATE.test(value);
}

/** Data de hoje no fuso do negócio, independente do fuso do servidor. */
export function todayIso(now: Date = new Date(), timeZone: string = APP_TIME_ZONE): IsoDate {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtcMs(date: IsoDate): number {
  if (!isIsoDate(date)) throw new Error(`Data inválida: ${date}`);
  return Date.parse(`${date}T00:00:00Z`);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return new Date(toUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Noites entre check-in e check-out (check-out não conta). */
export function daysBetween(start: IsoDate, end: IsoDate): number {
  return Math.round((toUtcMs(end) - toUtcMs(start)) / MS_PER_DAY);
}

export function startOfMonth(date: IsoDate): IsoDate {
  return `${date.slice(0, 7)}-01`;
}

export function daysInMonth(date: IsoDate): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});
const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "terça-feira, 3 de novembro" */
export function formatLongDate(date: IsoDate): string {
  return longDateFormatter.format(toUtcMs(date));
}

/** "03/11" */
export function formatShortDate(date: IsoDate): string {
  return shortDateFormatter.format(toUtcMs(date));
}

/** "3 de nov." */
export function formatDayMonth(date: IsoDate): string {
  return dayMonthFormatter.format(toUtcMs(date));
}

/** "3–6 nov." quando no mesmo mês, senão "30 de out. – 2 de nov." */
export function formatStayRange(checkIn: IsoDate, checkOut: IsoDate): string {
  if (checkIn.slice(0, 7) === checkOut.slice(0, 7)) {
    const [, month = ""] = formatDayMonth(checkOut).split(" de ");
    return `${Number(checkIn.slice(8))}–${Number(checkOut.slice(8))} ${month}`;
  }
  return `${formatDayMonth(checkIn)} – ${formatDayMonth(checkOut)}`;
}

/** Saudação pela hora local do negócio. */
export function greetingFor(now: Date = new Date(), timeZone: string = APP_TIME_ZONE): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(now),
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
