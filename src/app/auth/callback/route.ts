import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/features/auth/schemas";
import type { EmailOtpType } from "@/lib/supabase/auth-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["magiclink", "email", "signup", "invite", "recovery", "email_change"];

/**
 * Destino do link mágico. Aceita os dois formatos do Supabase:
 * - `?code=` (PKCE, link padrão do signInWithOtp);
 * - `?token_hash=&type=` (modelo de e-mail recomendado para SSR; também usado no teste E2E).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/login?erro=link", origin));
}
