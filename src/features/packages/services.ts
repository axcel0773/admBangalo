import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createPackagesRepository } from "./data/packages.repository";
import type { StayPackage } from "./domain";

export async function packagesRepository() {
  return createPackagesRepository(await createSupabaseServerClient());
}

export async function listPackages(): Promise<StayPackage[]> {
  return (await packagesRepository()).list();
}

export async function getPackage(id: string): Promise<StayPackage | null> {
  return (await packagesRepository()).findById(id);
}
