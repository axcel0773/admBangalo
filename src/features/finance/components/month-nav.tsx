import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { cn } from "@/lib/cn";
import type { IsoDate } from "@/lib/dates";

import { formatMonth, monthParam, shiftMonth } from "../domain";

const linkClass =
  "flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface";

export const financeHref = (month: IsoDate) => `${routes.finance}?mes=${monthParam(month)}`;

/** Mês anterior / próximo; o mês vive na URL (?mes=2026-11). */
export function MonthNav({
  month,
  className,
  hrefFor = financeHref,
}: {
  month: IsoDate;
  className?: string;
  /** Monta o link de cada mês (padrão: a tela do Financeiro). */
  hrefFor?: (month: IsoDate) => string;
}) {
  return (
    <nav aria-label="Mês" className={cn("flex items-center gap-1 rounded-2xl bg-muted p-1", className)}>
      <Link href={hrefFor(shiftMonth(month, -1))} aria-label="Mês anterior" className={linkClass}>
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Link>
      <span className="flex h-10 min-w-40 items-center justify-center rounded-xl bg-surface px-4 text-sm font-semibold capitalize shadow-sm">
        {formatMonth(month)}
      </span>
      <Link href={hrefFor(shiftMonth(month, 1))} aria-label="Próximo mês" className={linkClass}>
        <ChevronRight className="size-5" aria-hidden="true" />
      </Link>
    </nav>
  );
}
