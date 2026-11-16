"use client";

import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/cn";

const CONFIRM_WINDOW_MS = 4000;

/**
 * Ícone de sair do menu lateral, em dois toques (sem window.confirm, que trava a página
 * e destoa no app instalado): o primeiro toque pede confirmação, o segundo sai.
 */
export function SignOutButton() {
  const [asking, setAsking] = useState(false);

  // Sem segundo toque, volta ao estado normal sozinho.
  useEffect(() => {
    if (!asking) return;
    const timer = setTimeout(() => setAsking(false), CONFIRM_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [asking]);

  const label = asking ? "Confirmar: sair da conta" : "Sair da conta";

  return (
    <form
      action={signOut}
      onSubmit={(event) => {
        if (asking) return;
        event.preventDefault();
        setAsking(true);
      }}
    >
      <button
        type="submit"
        aria-label={label}
        title={label}
        className={cn(
          "flex h-9 items-center justify-center gap-1.5 rounded-[10px] border text-xs font-semibold transition-colors",
          asking
            ? "border-transparent bg-danger-soft px-2.5 text-danger-ink"
            : "w-9 border-line bg-surface text-ink-soft hover:bg-muted hover:text-danger-ink",
        )}
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        {asking ? "Sair?" : null}
      </button>
      <span aria-live="polite" className="sr-only">
        {asking ? "Toque de novo para sair da conta." : ""}
      </span>
    </form>
  );
}
