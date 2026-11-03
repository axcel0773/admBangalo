import "server-only";

import { assertMutation } from "@/lib/supabase/errors";
import { unwrap, unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { Chalet } from "../domain";
import type { ChaletInput } from "../schemas";

export function createChaletsRepository(db: DbClient) {
  return {
    async list(options: { onlyActive?: boolean } = {}): Promise<Chalet[]> {
      let query = db.from("chalets").select("*").order("name");
      if (options.onlyActive) query = query.eq("active", true);
      return unwrapList(await query, "Listar chalés");
    },

    async findById(id: string): Promise<Chalet | null> {
      const result = await db.from("chalets").select("*").eq("id", id).maybeSingle();
      if (result.error) return unwrap(result, "Buscar chalé");
      return result.data;
    },

    async create(input: ChaletInput): Promise<string> {
      const result = await db.from("chalets").insert(input).select("id").single();
      assertMutation(result, "Não foi possível cadastrar o chalé.");
      return unwrap(result, "Cadastrar chalé").id;
    },

    async update(id: string, input: ChaletInput): Promise<void> {
      const result = await db.from("chalets").update(input).eq("id", id);
      assertMutation(result, "Não foi possível salvar o chalé.");
    },
  };
}
