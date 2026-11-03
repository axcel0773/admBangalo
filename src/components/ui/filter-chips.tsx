import Link from "next/link";

import { cn } from "@/lib/cn";

export interface FilterChip {
  href: string;
  label: string;
  active: boolean;
}

/** Filtros como links (o estado fica na URL, então funciona sem JavaScript e no voltar). */
export function FilterChips({ chips, label }: { chips: FilterChip[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {chips.map((chip) => (
        <Link
          key={chip.href}
          href={chip.href}
          aria-current={chip.active ? "true" : undefined}
          className={cn(
            "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-[13px] whitespace-nowrap",
            chip.active
              ? "border-ink bg-ink font-semibold text-surface"
              : "border-line-strong bg-surface text-ink-soft hover:bg-subtle",
          )}
        >
          {chip.label}
        </Link>
      ))}
    </nav>
  );
}
