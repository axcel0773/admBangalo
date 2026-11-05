import { ChevronRight, House, Settings, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { routes } from "@/components/layout/navigation";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";

interface ShortcutProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

function Shortcut({ href, icon, title, description, className }: ShortcutProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-ink shadow-sm",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink [&>svg]:size-5"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{title}</span>
        <span className="block truncate text-xs text-ink-muted">{description}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
    </Link>
  );
}

/** Atalhos no fim do Painel: Bangalôs, Hóspedes e Configurações. */
export function Shortcuts({ chaletCount }: { chaletCount: number }) {
  return (
    <section aria-labelledby="shortcuts-title">
      <h2 id="shortcuts-title" className="mb-3 font-display text-xl font-semibold md:text-2xl">
        Atalhos
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Shortcut
          href={routes.chalets}
          icon={<House />}
          title="Bangalôs"
          description={pluralize(chaletCount, "cadastrado", "cadastrados")}
        />
        <Shortcut href={routes.guests} icon={<Users />} title="Hóspedes" description="Contatos e histórico" />
        <Shortcut
          href={routes.settings}
          icon={<Settings />}
          title="Configurações"
          description="Conta, perfil e preferências"
          className="col-span-2 md:col-span-1"
        />
      </div>
    </section>
  );
}
