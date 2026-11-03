import "server-only";

import { requireOwner } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createProfileRepository, type Profile } from "./data/profile.repository";

export async function profileRepository() {
  return createProfileRepository(await createSupabaseServerClient());
}

export async function getMyProfile(): Promise<Profile | null> {
  const owner = await requireOwner();
  return (await profileRepository()).findById(owner.id);
}

export type { Profile };
