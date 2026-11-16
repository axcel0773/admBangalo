import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "./button";

/** Link "Ver mais" de listas longas: recarrega a mesma tela com mais linhas, sem voltar ao topo. */
export function ShowMore({ href, shown }: { href: string; shown: number }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <p className="text-xs text-ink-muted">Mostrando os {shown} primeiros.</p>
      <Link href={href} scroll={false} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        <ChevronDown aria-hidden="true" />
        Ver mais
      </Link>
    </div>
  );
}
