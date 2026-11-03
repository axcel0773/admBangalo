import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { paths } from "@/components/layout/navigation";
import { cn } from "@/lib/cn";
import { addDays, type IsoDate } from "@/lib/dates";

interface PeriodNavProps {
  start: IsoDate;
  today: IsoDate;
  /** Quantos dias cada seta avança. */
  step: number;
  className?: string;
}

const linkClass =
  "flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface";

/** Setas de período + "Hoje"; o período vive na URL (?inicio=). */
export function PeriodNav({ start, today, step, className }: PeriodNavProps) {
  return (
    <nav aria-label="Período" className={cn("flex items-center gap-1 rounded-2xl bg-muted p-1", className)}>
      <Link href={paths.calendar({ start: addDays(start, -step) })} aria-label="Período anterior" className={linkClass}>
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Link>
      <Link
        href={paths.calendar({ start: today, day: today })}
        className="flex h-10 items-center rounded-xl bg-surface px-4 text-sm font-semibold shadow-sm"
      >
        Hoje
      </Link>
      <Link href={paths.calendar({ start: addDays(start, step) })} aria-label="Próximo período" className={linkClass}>
        <ChevronRight className="size-5" aria-hidden="true" />
      </Link>
    </nav>
  );
}
