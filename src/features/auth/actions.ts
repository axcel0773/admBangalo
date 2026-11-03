"use server";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  magicLinkSchema,
  passwordSignInSchema,
  safeRedirectPath,
  type AuthFormState,
} from "./schemas";

function firstErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Partial<Record<"email" | "password", string>> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if ((field === "email" || field === "password") && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

/** Ponto único do formulário de login; o campo `mode` escolhe a estratégia. */
export async function signIn(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return formData.get("mode") === "magic-link"
    ? sendMagicLink(prev, formData)
    : signInWithPassword(prev, formData);
}

async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordSignInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: firstErrors(parsed.error.issues),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { status: "error", message: "E-mail ou senha incorretos." };

  redirect(safeRedirectPath(parsed.data.next));
}

async function sendMagicLink(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = magicLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe um e-mail válido.",
      fieldErrors: firstErrors(parsed.error.issues),
    };
  }

  const callbackUrl = new URL("/auth/callback", env.NEXT_PUBLIC_SITE_URL);
  callbackUrl.searchParams.set("next", safeRedirectPath(parsed.data.next));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl.toString(), shouldCreateUser: false },
  });

  if (error) return { status: "error", message: "Não foi possível enviar o link. Tente de novo." };

  return { status: "link-sent", email: parsed.data.email };
}

export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
