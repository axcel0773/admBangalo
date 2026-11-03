import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CurrentOwner {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
}

const FALLBACK_BUSINESS_NAME = "Meus Chalés";

/**
 * Usuário logado + perfil. `cache` evita repetir a consulta
 * quando layout e página pedem o mesmo dado na mesma requisição.
 */
export const getCurrentOwner = cache(async (): Promise<CurrentOwner | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? "";
  return {
    id: user.id,
    email,
    fullName: profile?.full_name || email.split("@")[0] || "Proprietário",
    businessName: profile?.business_name || FALLBACK_BUSINESS_NAME,
  };
});

/** Para páginas protegidas: garante o usuário ou manda para o login. */
export async function requireOwner(): Promise<CurrentOwner> {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/login");
  return owner;
}
