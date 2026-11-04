import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Informe um e-mail válido");

export const passwordSignInSchema = z.object({
  email,
  password: z.string().min(6, "A senha tem pelo menos 6 caracteres"),
  next: z.string().optional(),
});

export const magicLinkSchema = z.object({
  email,
  next: z.string().optional(),
});

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<"email" | "password", string>> }
  | { status: "link-sent"; email: string };

export const initialAuthState: AuthFormState = { status: "idle" };

/** Aceita só caminhos internos, para não virar redirecionamento aberto. */
export function safeRedirectPath(next: string | undefined | null): string {
  // "/\\site.com" e "/\t/site.com" são lidos pelo navegador como "//site.com" (outro site).
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.includes("\\") || /[\u0000-\u001f\u007f]/.test(next)) return "/";
  return next;
}
