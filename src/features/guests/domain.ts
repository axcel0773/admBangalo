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
