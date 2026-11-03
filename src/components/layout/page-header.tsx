import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { BackLink } from "./back-link";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Link "voltar" acima do título (telas de detalhe e formulários). */
  back?: { href: string; label: string };
  className?: string;
}

export function PageHeader({ title, eyebrow, description, actions, back, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 px-4 pt-6 pb-4 md:px-11 md:pt-9 md:pb-6",
        back && "pt-3 md:pt-6",
        className,
      )}
    >
      <div className="min-w-0">
        {back ? <BackLink href={back.href} label={back.label} /> : null}
        {eyebrow ? <p className="mb-1 text-sm font-medium text-ink-muted">{eyebrow}</p> : null}
        <h1 className="font-display text-[30px] leading-tight font-semibold md:text-[40px]">{title}</h1>
        {description ? <div className="mt-2 text-[15px] text-ink-soft">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

/** Área de conteúdo com o mesmo respiro lateral do cabeçalho. */
export function PageBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col gap-4 px-4 md:gap-7 md:px-11", className)}>{children}</div>;
}
