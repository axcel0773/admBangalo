"use client";

import { LogOut } from "lucide-react";

import { signOut } from "@/features/auth/actions";

/** Ícone de sair do menu lateral; pergunta antes de encerrar a sessão. */
export function SignOutButton() {
  return (
    <form
      action={signOut}
      onSubmit={(event) => {
        if (!window.confirm("Sair da conta?")) event.preventDefault();
      }}
    >
      <button
        type="submit"
        aria-label="Sair da conta"
        title="Sair da conta"
        className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface text-ink-soft transition-colors hover:bg-muted hover:text-danger-ink"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
