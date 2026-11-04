import { csvDate, toCsv } from "@/lib/csv";
import type { Tables, Views } from "@/types/database";

export type Guest = Tables<"guests">;

export type GuestStay = Pick<
  Views<"reservation_financials">,
  | "reservation_id"
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
}

/** "São Paulo/SP" ou só a parte que existir. */
export function formatCityState(guest: Pick<Guest, "city" | "state">): string | null {
  if (guest.city && guest.state) return `${guest.city}/${guest.state}`;
  return guest.city ?? guest.state ?? null;
}

/** Nome gravado pela função anonymize_guest (LGPD). */
export const ANONYMIZED_GUEST_NAME = "Hóspede removido";

/** Link do WhatsApp (assume Brasil quando o número vem sem DDI). */
export function whatsappUrl(phone: string | null, text?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${withCountry}${query}`;
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
