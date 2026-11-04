import "server-only";

import { MutationError, assertMutation } from "@/lib/supabase/errors";
import { unwrap, unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { Fee } from "../domain";
import type { FeeInput } from "../schemas";

export function createFeesRepository(db: DbClient) {
  return {
    async list(options: { onlyActive?: boolean } = {}): Promise<Fee[]> {
      let query = db.from("fees").select("*").order("name");
      if (options.onlyActive) query = query.eq("active", true);
      return unwrapList(await query, "Listar taxas");
    },

    async findById(id: string): Promise<Fee | null> {
      const result = await db.from("fees").select("*").eq("id", id).maybeSingle();
      if (result.error) return unwrap(result, "Buscar taxa");
      return result.data;
    },

    async create(input: FeeInput): Promise<void> {
      assertMutation(await db.from("fees").insert(input), "Não foi possível cadastrar a taxa.");
    },

    async update(id: string, input: FeeInput): Promise<void> {
      assertMutation(await db.from("fees").update(input).eq("id", id), "Não foi possível salvar a taxa.");
    },

    /** Reservas já criadas guardam uma cópia da taxa (fee_id vira nulo), então seguem iguais. */
    async remove(id: string): Promise<void> {
      const result = await db.from("fees").delete().eq("id", id).select("id");
      assertMutation(result, "Não foi possível excluir a taxa.");
      if (!result.data || result.data.length === 0) throw new MutationError("Taxa não encontrada.");
    },
  };
}
