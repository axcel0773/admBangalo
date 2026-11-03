import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createFeesRepository } from "./data/fees.repository";
import type { Fee } from "./domain";

export async function feesRepository() {
  return createFeesRepository(await createSupabaseServerClient());
}

export async function listFees(options: { onlyActive?: boolean } = {}): Promise<Fee[]> {
  return (await feesRepository()).list(options);
}

export async function getFee(id: string): Promise<Fee | null> {
  return (await feesRepository()).findById(id);
}
