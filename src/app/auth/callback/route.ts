import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/features/auth/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Destino do link mágico: troca o `code` por sessão e segue para o app. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/login?erro=link", origin));
}
