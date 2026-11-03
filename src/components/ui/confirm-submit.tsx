"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Button, type ButtonProps } from "./button";
import { SubmitButton } from "./submit-button";

interface ConfirmSubmitProps {
  /** Pergunta mostrada no segundo toque. */
  message: string;
  /** Conteúdo do botão inicial. */
  children: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  /** Aparência do botão inicial. */
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerLabel?: string;
  block?: boolean;
  className?: string;
}

/**
 * Envio em dois toques para ações difíceis de desfazer (cancelar, remover).
 * Evita window.confirm, que bloqueia a página e fica feio no PWA.
 * Deve ficar dentro de um <form action={...}>.
 */
export function ConfirmSubmit({
  message,
  children,
  confirmLabel = "Sim, cancelar",
  pendingLabel = "Cancelando…",
  triggerVariant = "ghost",
  triggerSize,
  triggerLabel,
  block = true,
  className,
}: ConfirmSubmitProps) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button
        variant={triggerVariant}
        size={triggerSize}
        block={block}
        aria-label={triggerLabel}
        className={cn("text-danger-ink", className)}
        onClick={() => setAsking(true)}
      >
        {children}
      </Button>
    );
  }

  return (
    <div role="alertdialog" aria-label="Confirmar" className="flex w-full flex-col gap-2 rounded-2xl bg-danger-soft p-3">
      <p className="text-sm font-semibold text-danger-ink">{message}</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => setAsking(false)}>
          Voltar
        </Button>
        <SubmitButton size="sm" variant="accent" className="flex-1" pendingLabel={pendingLabel}>
          {confirmLabel}
        </SubmitButton>
      </div>
    </div>
  );
}
