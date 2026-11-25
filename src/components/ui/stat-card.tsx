import { ChevronRight } from "lucide-react";
import Link from "next/link";
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
  /** Com link, o cartão inteiro vira um atalho (setinha no canto e reação ao toque). */
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconTone = "primary",
  footer,
  children,
  href,
  className,
}: StatCardProps) {
  const body = (
    <>
      <IconTile tone={iconTone} className="hidden md:inline-flex">
        {icon}
      </IconTile>
      <p className="text-xs font-medium text-ink-muted md:text-[13px]">{label}</p>
      <p className="font-display text-2xl leading-none font-semibold md:text-[34px]">{value}</p>
      {children}
      {footer ? <div className="text-[11px] text-ink-muted md:text-[13px]">{footer}</div> : null}
    </>
  );
  const base = "flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card md:gap-2.5 md:p-5.5";

  if (!href) return <div className={cn(base, className)}>{body}</div>;

  return (
    <Link
      href={href}
      className={cn(
        base,
        "relative text-ink ring-1 ring-transparent transition-[box-shadow,transform] hover:ring-primary/40 active:scale-[0.98]",
        className,
      )}
    >
      <ChevronRight className="absolute top-3.5 right-3 size-4 text-ink-muted md:top-5 md:right-5" aria-hidden="true" />
      {body}
    </Link>
  );
}
