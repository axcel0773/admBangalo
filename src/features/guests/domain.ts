import { csvDate, toCsv } from "@/lib/csv";
import type { IsoDate } from "@/lib/dates";
import type { Tables, Views } from "@/types/database";

export type Guest = Tables<"guests">;

export type GuestStay = Pick<
  Views<"reservation_financials">,
  | "reservation_id"
  | "chalet_id"
  | "chalet_name"
  | "check_in"
  | "check_out"
  | "nights"
  | "guests_count"
  | "status"
  | "grand_total"
  | "payment_status"
>;

export interface GuestSummary extends Guest {
  staysCount: number;
  lastStay: GuestStay | null;
  /** Voltou a se hospedar (2 ou mais estadias não canceladas). */
  recurring: boolean;
  /** Faz aniversário no mês atual. */
  birthdayThisMonth: boolean;
}

/** Quantas estadias não canceladas fazem do hóspede um cliente recorrente. */
export const RECURRING_MIN_STAYS = 2;

export const GUEST_FILTERS = {
  all: "Todos",
  recurring: "Recorrentes",
  birthdays: "Aniversariantes do mês",
} as const;

export type GuestFilter = keyof typeof GUEST_FILTERS;

export function isGuestFilter(value: string | undefined): value is GuestFilter {
  return value !== undefined && Object.hasOwn(GUEST_FILTERS, value);
}

/** Estadias que contam: reservas canceladas ficam no histórico, mas não são estadias. */
export function activeStays<T extends Pick<GuestStay, "status">>(stays: T[]): T[] {
  return stays.filter((stay) => stay.status !== "cancelled");
}

/** Cliente recorrente: estadias canceladas não contam. */
export function isRecurringGuest(stays: Pick<GuestStay, "status">[]): boolean {
  return activeStays(stays).length >= RECURRING_MIN_STAYS;
}

/** Aniversário no mesmo mês de `today` (datas ISO "AAAA-MM-DD"). */
export function isBirthdayMonth(birthDate: string | null, today: IsoDate): boolean {
  return birthDate !== null && birthDate.slice(5, 7) === today.slice(5, 7);
}

export function filterGuests(guests: GuestSummary[], filter: GuestFilter): GuestSummary[] {
  if (filter === "recurring") return guests.filter((guest) => guest.recurring);
  if (filter === "birthdays") return guests.filter((guest) => guest.birthdayThisMonth);
  return guests;
}

/** "São Paulo/SP" ou só a parte que existir. */
export function formatCityState(guest: Pick<Guest, "city" | "state">): string | null {
  if (guest.city && guest.state) return `${guest.city}/${guest.state}`;
  return guest.city ?? guest.state ?? null;
}

/** Nome gravado pela função anonymize_guest (LGPD). */
export const ANONYMIZED_GUEST_NAME = "Hóspede removido";

/**
 * Codifica para a URL em UTF-8 e também os caracteres que o encodeURIComponent deixa
 * passar (! ' ( ) *) e que alguns navegadores embutidos tratam como fim do texto.
 * toWellFormed troca pares de surrogate quebrados (viram "�" no WhatsApp) por U+FFFD
 * antes de codificar, em vez de gerar um %-código inválido.
 */
export function encodeForUrl(text: string): string {
  return encodeURIComponent(text.toWellFormed()).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Link do WhatsApp (assume Brasil quando o número vem sem DDI).
 * Usa api.whatsapp.com/send, o destino final do wa.me: pular o redirecionamento evita
 * que emojis e acentos se percam no meio do caminho em alguns aparelhos.
 */
export function whatsappUrl(phone: string | null, text?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  const query = text ? `&text=${encodeForUrl(text)}` : "";
  return `https://api.whatsapp.com/send?phone=${withCountry}${query}`;
}

/** Remove caracteres que quebram o filtro `or` do PostgREST. */
export function sanitizeSearch(term: string): string {
  return term.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
}

const GUESTS_CSV_HEADER = ["Nome", "CPF/Documento", "Nascimento", "Telefone", "E-mail", "Cidade", "UF", "Observações", "Cadastro"];

/** Cadastro completo dos hóspedes (backup e portabilidade de dados). */
export function guestsCsv(guests: Guest[]): string {
  return toCsv(
    GUESTS_CSV_HEADER,
    guests.map((guest) => [
      guest.full_name,
      guest.document,
      guest.birth_date ? csvDate(guest.birth_date) : null,
      guest.phone,
      guest.email,
      guest.city,
      guest.state,
      guest.notes,
      csvDate(guest.created_at.slice(0, 10)),
    ]),
  );
}

export type GuestContact = Pick<Guest, "id" | "full_name" | "phone">;

/** Dígitos do telefone sem o código do país (55), para comparar cadastros. */
export function phoneKey(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
}

/**
 * Hóspede já cadastrado com o mesmo telefone (para avisar antes de duplicar).
 * Precisa de pelo menos 10 dígitos (DDD + número) para não acusar número incompleto.
 */
export function findGuestByPhone<T extends { id: string; phone: string | null }>(
  guests: T[],
  phone: string,
  exceptId?: string,
): T | null {
  const key = phoneKey(phone);
  if (key.length < 10) return null;
  return guests.find((guest) => guest.id !== exceptId && phoneKey(guest.phone) === key) ?? null;
}
