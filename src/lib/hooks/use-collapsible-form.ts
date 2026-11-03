"use client";

import { useState } from "react";

import type { FormState } from "@/lib/forms";

/**
 * Formulário que abre num toque e fecha sozinho quando a Server Action dá certo.
 * Ajusta o estado durante a renderização (sem useEffect), como pede o React Compiler.
 */
export function useCollapsibleForm(state: FormState) {
  const [open, setOpen] = useState(false);
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success") setOpen(false);
  }
  return { open, openForm: () => setOpen(true), closeForm: () => setOpen(false) };
}
