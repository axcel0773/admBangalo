"use client";

import { Lightbulb, X } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const EVENT = "dica-fechada";
const key = (id: string) => `dica:${id}`;

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function isDismissed(id: string): boolean {
  try {
    return window.localStorage.getItem(key(id)) === "1";
  } catch {
    // Sem armazenamento (aba anônima etc.): mostra a dica normalmente.
    return false;
  }
}

interface TipProps {
  /** Identificador estável: a dica fechada não volta a aparecer neste aparelho. */
  id: string;
  children: ReactNode;
  className?: string;
}

/**
 * Dica curta para quem está começando. Aparece até ser fechada com um toque
 * (fica lembrado no aparelho). No servidor não renderiza, para não piscar.
 */
export function Tip({ id, children, className }: TipProps) {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => isDismissed(id),
    () => true,
  );
  if (dismissed) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(key(id), "1");
    } catch {
      // ignora: a dica só some nesta visita
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <div
      role="note"
      className={cn(
        "animate-pop flex items-start gap-2.5 rounded-xl bg-primary-soft py-2.5 pr-1 pl-3 text-sm text-primary-ink",
        className,
      )}
    >
      <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 leading-snug">{children}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar dica"
        className="-my-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg active:bg-primary/10"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
