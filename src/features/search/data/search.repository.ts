import "server-only";

import { sanitizeSearch } from "@/features/guests/domain";
import { unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import { SEARCH_LIMIT, type SearchGuestHit, type SearchQuoteHit, type SearchReservationHit } from "../domain";

/** Consultas da busca global; o RLS limita tudo ao proprietário logado. */
export function createSearchRepository(db: DbClient) {
  return {
    async guests(term: string): Promise<SearchGuestHit[]> {
      const clean = sanitizeSearch(term);
      const rows = unwrapList(
        await db
          .from("guests")
          .select("id, full_name, phone")
          .is("deleted_at", null)
          .or(`full_name.ilike.%${clean}%,document.ilike.%${clean}%,phone.ilike.%${clean}%`)
          .order("full_name")
          .limit(SEARCH_LIMIT),
        "Buscar hóspedes",
      );
      return rows.map((row) => ({ id: row.id, name: row.full_name, phone: row.phone }));
    },

    async reservations(term: string): Promise<SearchReservationHit[]> {
      const clean = sanitizeSearch(term);
      const rows = unwrapList(
        await db
          .from("reservation_financials")
          .select("reservation_id, main_guest_name, chalet_name, check_in, check_out, status")
          .or(`main_guest_name.ilike.%${clean}%,chalet_name.ilike.%${clean}%`)
          .order("check_in", { ascending: false })
          .limit(SEARCH_LIMIT),
        "Buscar reservas",
      );
      return rows.map((row) => ({
        id: row.reservation_id,
        guestName: row.main_guest_name,
        chaletName: row.chalet_name,
        checkIn: row.check_in,
        checkOut: row.check_out,
        status: row.status,
      }));
    },

    async quotes(term: string): Promise<SearchQuoteHit[]> {
      const clean = sanitizeSearch(term);
      const rows = unwrapList(
        await db
          .from("quotes")
          .select("id, guest_name, check_in, check_out")
          .ilike("guest_name", `%${clean}%`)
          .order("created_at", { ascending: false })
          .limit(SEARCH_LIMIT),
        "Buscar orçamentos",
      );
      return rows.map((row) => ({ id: row.id, guestName: row.guest_name, checkIn: row.check_in, checkOut: row.check_out }));
    },
  };
}
