import { addDays, isIsoDate, type IsoDate } from "@/lib/dates";

/**
 * iCalendar (RFC 5545) no mínimo que Airbnb, Booking e Google usam:
 * eventos de dia inteiro com DTSTART/DTEND e UID.
 */

export interface IcalEvent {
  uid: string;
  /** Primeira noite ocupada. */
  start: IsoDate;
  /** Dia da saída (exclusivo). */
  end: IsoDate;
  summary: string;
}

/** Junta linhas dobradas (continuação começa com espaço ou tab). */
function unfold(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

/** "20261210", "20261210T140000Z" ou "20261210T140000" → "2026-12-10". */
export function icalDate(value: string): IsoDate | null {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim());
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  // Confere se a data existe (ex.: 31/02 não).
  const parsed = new Date(`${iso}T00:00:00Z`);
  return isIsoDate(iso) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();
}

/** Lê os eventos ocupados de um .ics. Ignora cancelados e datas inválidas. */
export function parseIcs(text: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  let current: Record<string, string> | null = null;

  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) {
        const start = icalDate(current.DTSTART ?? "");
        const end = current.DTEND ? icalDate(current.DTEND) : start ? addDays(start, 1) : null;
        const cancelled = (current.STATUS ?? "").toUpperCase() === "CANCELLED";
        if (start && end && end > start && !cancelled) {
          events.push({
            uid: current.UID || `${start}-${end}`,
            start,
            end,
            summary: unescapeText(current.SUMMARY ?? ""),
          });
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    // "DTSTART;VALUE=DATE" → "DTSTART"
    const name = line.slice(0, colon).split(";")[0]?.toUpperCase() ?? "";
    current[name] = line.slice(colon + 1);
  }
  return events;
}

/** Mantém só o que importa para a agenda: termina a partir de `from`. */
export function relevantEvents(events: IcalEvent[], from: IsoDate): IcalEvent[] {
  return events.filter((event) => event.end >= from);
}

// ---- Exportação --------------------------------------------------------------

const compact = (date: IsoDate) => date.replace(/-/g, "");

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Dobra linhas acima de 75 caracteres, como pede a RFC. */
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ` ${rest.slice(75)}`;
  }
  parts.push(rest);
  return parts.join("\r\n");
}

/** Calendário .ics com as datas ocupadas (sem dados de hóspedes). */
export function buildIcs(input: { name: string; events: IcalEvent[]; stamp: Date }): string {
  const dtstamp = input.stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//admBangalo//Chalés//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(input.name)}`,
    ...input.events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${escapeText(event.uid)}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(event.start)}`,
      `DTEND;VALUE=DATE:${compact(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

// ---- Segurança do link importado ---------------------------------------------

const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?|\[?f[cd][0-9a-f]{2}:)/i;

/**
 * Só aceita https e nomes públicos: o servidor vai buscar esse endereço,
 * então não pode apontar para a rede interna (SSRF).
 */
export function icalUrlProblem(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return "Cole o link completo do calendário (começa com https://).";
  }
  if (url.protocol !== "https:") return "O link precisa começar com https://.";
  if (url.username || url.password) return "O link não pode ter usuário e senha.";
  if (PRIVATE_HOST.test(url.hostname)) return "Esse endereço não é público.";
  if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || url.hostname.includes(":")) {
    return "Use o link com o nome do site, não o número IP.";
  }
  return null;
}
