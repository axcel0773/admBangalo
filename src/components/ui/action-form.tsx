"use client";

import { useActionState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { idleFormState, type FormState } from "@/lib/forms";

interface ActionFormProps {
  /** Server Action com ids já ligados por `.bind(null, …)`. */
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  className?: string;
  children: ReactNode;
}

/**
 * <form> para ações de um botão (remover, sincronizar, status).
 * Mostra o erro devolvido pela ação logo abaixo, sem tirar o usuário da tela.
 */
export function ActionForm({ action, className, children }: ActionFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  return (
    <form action={formAction} className={className}>
      {children}
      {state.status === "error" ? (
        <p role="alert" className={cn("basis-full text-xs font-semibold text-danger-ink", "mt-1")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
