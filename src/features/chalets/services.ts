import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createChaletsRepository } from "./data/chalets.repository";
import type { Chalet } from "./domain";

async function repository() {
  return createChaletsRepository(await createSupabaseServerClient());
}

export async function listChalets(options: { onlyActive?: boolean } = {}): Promise<Chalet[]> {
  return (await repository()).list(options);
}

export async function getChalet(id: string): Promise<Chalet | null> {
  return (await repository()).findById(id);
}

export { repository as chaletsRepository };
