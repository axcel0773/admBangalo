import "server-only";

import { assertMutation } from "@/lib/supabase/errors";
import { unwrap, unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import { sanitizeSearch, type Guest, type GuestStay } from "../domain";
import type { GuestInput } from "../schemas";

const STAY_COLUMNS =
  "reservation_id, main_guest_id, chalet_name, check_in, check_out, nights, guests_count, status, grand_total, payment_status";

export function createGuestsRepository(db: DbClient) {
  return {
    /** Busca por nome, documento ou telefone; sem termo, os mais recentes. */
    async search(term: string | undefined, limit = 50): Promise<Guest[]> {
      let query = db.from("guests").select("*").limit(limit);
      const clean = term ? sanitizeSearch(term) : "";
      if (clean) {
        query = query
          .or(`full_name.ilike.%${clean}%,document.ilike.%${clean}%,phone.ilike.%${clean}%`)
          .order("full_name");
      } else {
        query = query.order("updated_at", { ascending: false });
      }
      return unwrapList(await query, "Buscar hóspedes");
    },

    async findById(id: string): Promise<Guest | null> {
      const result = await db.from("guests").select("*").eq("id", id).maybeSingle();
      if (result.error) return unwrap(result, "Buscar hóspede");
      return result.data;
    },

    /** Estadias em que o hóspede é o responsável, mais recentes primeiro. */
    async listStays(guestIds: string[]): Promise<(GuestStay & { main_guest_id: string })[]> {
      if (guestIds.length === 0) return [];
      const result = await db
        .from("reservation_financials")
        .select(STAY_COLUMNS)
        .in("main_guest_id", guestIds)
        .order("check_in", { ascending: false });
      return unwrapList(result, "Listar estadias do hóspede");
    },

    async create(input: GuestInput): Promise<string> {
      const result = await db.from("guests").insert(input).select("id").single();
      assertMutation(result, "Não foi possível cadastrar o hóspede.");
      return unwrap(result, "Cadastrar hóspede").id;
    },

    async update(id: string, input: GuestInput): Promise<void> {
      assertMutation(await db.from("guests").update(input).eq("id", id), "Não foi possível salvar o hóspede.");
    },

    /** LGPD: apaga dados pessoais e mantém reservas e pagamentos (função anonymize_guest). */
    async anonymize(id: string): Promise<void> {
      assertMutation(await db.rpc("anonymize_guest", { p_guest_id: id }), "Não foi possível apagar os dados.");
    },
  };
}
