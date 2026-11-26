import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { buttonVariants } from "./button";

interface MoreOptionsProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Ações menos usadas guardadas atrás de um botão "Mais opções" (abre e fecha no lugar).
 * Usa <details>: funciona sem JavaScript e o leitor de tela anuncia aberto/fechado.
 */
export function MoreOptions({ label = "Mais opções", children, className }: MoreOptionsProps) {
  return (
    <details className={cn("group", className)}>
      <summary
        className={buttonVariants({
          variant: "secondary",
          block: true,
          className: "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
        })}
      >
        {label}
        <ChevronDown aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="animate-expand mt-2.5 flex origin-top flex-col gap-2.5">{children}</div>
    </details>
  );
}
