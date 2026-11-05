import "server-only";

import { MutationError, assertMutation } from "@/lib/supabase/errors";
import { unwrap, unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { Chalet } from "../domain";
import type { ChaletInput } from "../schemas";

export function createChaletsRepository(db: DbClient) {
  return {
    async list(options: { onlyActive?: boolean } = {}): Promise<Chalet[]> {
      let query = db.from("chalets").select("*").order("name");
      if (options.onlyActive) query = query.eq("active", true);
      return unwrapList(await query, "Listar bangalôs");
    },

    async findById(id: string): Promise<Chalet | null> {
      const result = await db.from("chalets").select("*").eq("id", id).maybeSingle();
      if (result.error) return unwrap(result, "Buscar bangalô");
      return result.data;
    },

    async create(input: ChaletInput): Promise<string> {
      const result = await db.from("chalets").insert(input).select("id").single();
      assertMutation(result, "Não foi possível cadastrar o bangalô.");
      return unwrap(result, "Cadastrar bangalô").id;
    },

    async update(id: string, input: ChaletInput): Promise<void> {
      const result = await db.from("chalets").update(input).eq("id", id);
      assertMutation(result, "Não foi possível salvar o bangalô.");
    },

    /** Grava o caminho da foto (ou null) e devolve o caminho anterior. */
    async setPhotoPath(id: string, path: string | null): Promise<string | null> {
      const { data: before } = await db.from("chalets").select("photo_path").eq("id", id).maybeSingle();
      const result = await db.from("chalets").update({ photo_path: path }).eq("id", id).select("id");
      assertMutation(result, "Não foi possível salvar a foto.");
      if (!result.data || result.data.length === 0) throw new MutationError("Bangalô não encontrado.");
      return before?.photo_path ?? null;
    },

    async removePhotoFile(path: string): Promise<void> {
      await db.storage.from("chalet-photos").remove([path]);
    },

    /** Link temporário (1 h) para exibir a foto. */
    async photoUrl(path: string | null): Promise<string | null> {
      if (!path) return null;
      const { data } = await db.storage.from("chalet-photos").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    },
  };
}
