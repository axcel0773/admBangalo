import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente para Server Components, Server Actions e Route Handlers.
 * Usa os cookies da requisição, então o RLS enxerga o usuário logado.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: cookies são somente leitura ali.
          // O middleware já renova a sessão, então pode ser ignorado.
        }
      },
    },
  });
}

/** Cliente tipado que os repositories recebem (inferido, segue a versão instalada). */
export type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
