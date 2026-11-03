"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Envio em dois toques para ações difíceis de desfazer.
 * Evita window.confirm (bloqueia a página e é feio no PWA).
 */
export function ConfirmSubmit({ message, children }: { message: string; children: ReactNode }) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button variant="ghost" block className="text-danger-ink" onClick={() => setAsking(true)}>
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
        <SubmitButton size="sm" variant="accent" className="flex-1" pendingLabel="Cancelando…">
          Sim, cancelar
        </SubmitButton>
      </div>
    </div>
  );
}
