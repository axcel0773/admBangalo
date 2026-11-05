import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CurrentOwner {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  /** URL temporária (1 h) da foto de perfil; null se não houver. */
  avatarUrl: string | null;
}

const FALLBACK_BUSINESS_NAME = "Meus Bangalôs";

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
    .select("full_name, business_name, avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  let avatarUrl: string | null = null;
  if (profile?.avatar_path) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = data?.signedUrl ?? null;
  }

  const email = user.email ?? "";
  return {
    id: user.id,
    email,
    fullName: profile?.full_name || email.split("@")[0] || "Proprietário",
    businessName: profile?.business_name || FALLBACK_BUSINESS_NAME,
    avatarUrl,
  };
});

/** Para páginas protegidas: garante o usuário ou manda para o login. */
export async function requireOwner(): Promise<CurrentOwner> {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/login");
  return owner;
}
