import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Grupo de campos com título, dentro de um cartão. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card md:p-6", className)}>
      <legend className="sr-only">{title}</legend>
      <div aria-hidden="true">
        <p className="font-display text-lg font-semibold">{title}</p>
        {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}

/** Campos lado a lado a partir do tablet; empilhados no celular. */
export function FieldRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 md:grid-cols-2", className)}>{children}</div>;
}

/**
 * Barra de ações do formulário. No celular fica presa acima da barra inferior,
 * ao alcance do polegar; no desktop, alinhada à direita no fim do formulário.
 */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "keyboard-static sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none [&>*]:flex-1 md:[&>*]:flex-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
