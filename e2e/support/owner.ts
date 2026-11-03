import { createClient } from "@supabase/supabase-js";

/**
 * Cria um proprietário descartável no Supabase LOCAL (supabase start).
 * A service_role key só existe no processo do teste — nunca no app nem em NEXT_PUBLIC_*.
 */
export function hasLocalSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    throw new Error("Os testes E2E só rodam contra o Supabase local (127.0.0.1/localhost).");
  }
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface TestOwner {
  id: string;
  email: string;
  password: string;
  remove: () => Promise<void>;
}

export async function createTestOwner(): Promise<TestOwner> {
  const client = admin();
  const email = `e2e-${Date.now()}-${Math.round(Math.random() * 1e6)}@teste.local`;
  const password = `Senha-${crypto.randomUUID()}`;
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Dono E2E" },
  });
  if (error || !data.user) throw error ?? new Error("Não criou o usuário de teste.");
  const id = data.user.id;
  return {
    id,
    email,
    password,
    // Apaga o usuário; as tabelas têm on delete cascade no owner_id.
    remove: async () => {
      await client.auth.admin.deleteUser(id);
    },
  };
}
