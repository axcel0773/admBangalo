import "server-only";

import type { IsoDate } from "@/lib/dates";
import { MutationError, assertMutation } from "@/lib/supabase/errors";
import { unwrap, unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert } from "@/types/database";

import type { QuoteStatus, StayRange } from "../domain/status";

export type Quote = Tables<"quotes">;
export type NewQuote = Omit<TablesInsert<"quotes">, "id" | "owner_id">;

export function createQuotesRepository(db: DbClient) {
  return {
    async list(limit = 100): Promise<Quote[]> {
      return unwrapList(await db.from("quotes").select("*").order("created_at", { ascending: false }).limit(limit), "Listar orçamentos");
    },

    async findById(id: string): Promise<Quote | null> {
      const result = await db.from("quotes").select("*").eq("id", id).maybeSingle();
      if (result.error) return unwrap(result, "Buscar orçamento");
      return result.data;
    },

    async create(input: NewQuote): Promise<string> {
      const result = await db.from("quotes").insert(input).select("id").single();
      assertMutation(result, "Não foi possível salvar o orçamento.");
      if (!result.data) throw new MutationError("Não foi possível salvar o orçamento.");
      return result.data.id;
    },

    async setStatus(id: string, status: QuoteStatus): Promise<void> {
      const result = await db.from("quotes").update({ status }).eq("id", id).select("id");
      assertMutation(result, "Não foi possível atualizar o orçamento.");
      if (!result.data || result.data.length === 0) throw new MutationError("Orçamento não encontrado.");
    },

    /** Estadias não canceladas que tocam [from, to]: servem para avisar quando as datas do orçamento foram ocupadas. */
    async listStaysTouching(from: IsoDate, to: IsoDate): Promise<StayRange[]> {
      const result = await db
        .from("reservation_financials")
        .select("chalet_id, check_in, check_out")
        .neq("status", "cancelled")
        .lt("check_in", to)
        .gt("check_out", from);
      return unwrapList(result, "Listar estadias para os orçamentos");
    },

    async remove(id: string): Promise<void> {
      const result = await db.from("quotes").delete().eq("id", id).select("id");
      assertMutation(result, "Não foi possível excluir o orçamento.");
      if (!result.data || result.data.length === 0) throw new MutationError("Orçamento não encontrado.");
    },
  };
}

export type QuotesRepository = ReturnType<typeof createQuotesRepository>;
