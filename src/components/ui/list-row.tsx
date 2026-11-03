import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface ListRowProps {
  href: string;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

/** Linha de lista clicável (avatar/ícone · título e subtítulo · valor ou badge). */
export function ListRow({ href, leading, title, subtitle, trailing, className }: ListRowProps) {
  return (
    <li>
      <Link href={href} className={cn("flex min-h-16 items-center gap-3 py-3 text-ink", className)}>
        {leading}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{title}</span>
          {subtitle ? <span className="block truncate text-xs text-ink-muted">{subtitle}</span> : null}
        </span>
        {trailing}
        <ChevronRight className="size-5 shrink-0 text-ink-muted/50" aria-hidden="true" />
      </Link>
    </li>
  );
}

/** Contêiner de linhas com divisórias. */
export function ListCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn("divide-y divide-line rounded-card bg-surface px-4 shadow-card md:px-5", className)}>
      {children}
    </ul>
  );
}
