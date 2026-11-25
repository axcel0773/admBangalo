import "server-only";

import { MutationError, assertMutation } from "@/lib/supabase/errors";
import { unwrap, unwrapList } from "@/lib/supabase/result";
import type { DbClient } from "@/lib/supabase/server";

import type { StayPackage } from "../domain";
import type { PackageInput } from "../schemas";

export function createPackagesRepository(db: DbClient) {
  return {
    async list(): Promise<StayPackage[]> {
      return unwrapList(await db.from("stay_packages").select("*").order("nights").order("name"), "Listar pacotes");
    },

    async findById(id: string): Promise<StayPackage | null> {
      const result = await db.from("stay_packages").select("*").eq("id", id).maybeSingle();
      if (result.error) return unwrap(result, "Buscar pacote");
      return result.data;
    },

    async create(input: PackageInput): Promise<void> {
      assertMutation(await db.from("stay_packages").insert(input), "Não foi possível cadastrar o pacote.");
    },

    async update(id: string, input: PackageInput): Promise<void> {
      assertMutation(await db.from("stay_packages").update(input).eq("id", id), "Não foi possível salvar o pacote.");
    },

    /** Reservas e orçamentos guardam uma cópia do pacote, então seguem iguais. */
    async remove(id: string): Promise<void> {
      const result = await db.from("stay_packages").delete().eq("id", id).select("id");
      assertMutation(result, "Não foi possível excluir o pacote.");
      if (!result.data || result.data.length === 0) throw new MutationError("Pacote não encontrado.");
    },
  };
}
