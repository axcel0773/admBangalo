import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { IconTile } from "./icon-tile";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconTone?: "primary" | "accent" | "neutral";
  /** Linha de contexto sob o número. */
  footer?: ReactNode;
  /** Conteúdo extra (ex.: barra de progresso). */
  children?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconTone = "primary",
  footer,
  children,
  className,
}: StatCardProps) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card md:gap-2.5 md:p-5.5", className)}>
      <IconTile tone={iconTone} className="hidden md:inline-flex">
        {icon}
      </IconTile>
      <p className="text-xs font-medium text-ink-muted md:text-[13px]">{label}</p>
      <p className="font-display text-2xl leading-none font-semibold md:text-[34px]">{value}</p>
      {children}
      {footer ? <div className="text-[11px] text-ink-muted md:text-[13px]">{footer}</div> : null}
    </div>
  );
}
