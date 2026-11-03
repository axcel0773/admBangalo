import "server-only";

import { assertMutation } from "@/lib/supabase/errors";
import type { DbClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import type { ProfileInput } from "../schemas";

export type Profile = Tables<"profiles">;

export function createProfileRepository(db: DbClient) {
  return {
    async findById(id: string): Promise<Profile | null> {
      const { data } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
      return data;
    },

    async update(id: string, input: ProfileInput): Promise<void> {
      assertMutation(await db.from("profiles").update(input).eq("id", id), "Não foi possível salvar o perfil.");
    },
  };
}
