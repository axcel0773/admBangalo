import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** Voltar para a tela anterior da hierarquia (não depende do histórico do navegador). */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-ink-soft hover:bg-muted"
    >
      <ChevronLeft className="size-5" aria-hidden="true" />
      {label}
    </Link>
  );
}
