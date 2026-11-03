"use client";

import { Printer } from "lucide-react";

import { Button, type ButtonProps } from "./button";

/** Abre a impressão do navegador; no celular, "Salvar como PDF" fica ali. */
export function PrintButton({ children = "Imprimir ou salvar PDF", ...props }: Omit<ButtonProps, "onClick">) {
  return (
    <Button onClick={() => window.print()} {...props}>
      <Printer aria-hidden="true" />
      {children}
    </Button>
  );
}
