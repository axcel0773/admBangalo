import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/cn";
import type { FormState } from "@/lib/forms";

/** Mensagem geral do formulário (erros por campo aparecem em cada campo). */
export function FormAlert({ state, className }: { state: FormState; className?: string }) {
  if (state.status === "idle") return null;
  const isError = state.status === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
        isError ? "bg-danger-soft text-danger-ink" : "bg-primary-soft text-primary-ink",
        className,
      )}
    >
      {isError ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      {state.message}
    </p>
  );
}
