import type { CookieOptions } from "@supabase/ssr";

/**
 * Formato dos cookies que o Supabase pede para gravar.
 * Declarado explicitamente porque a inferência do `setAll` falha
 * quando as versões de @supabase/ssr e @supabase/supabase-js divergem.
 */
export interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}
