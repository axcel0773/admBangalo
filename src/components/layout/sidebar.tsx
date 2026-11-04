"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

import { Brand } from "./brand";
import { isActivePath, sidebarItems } from "./navigation";
import { SignOutButton } from "./sign-out-button";

interface SidebarProps {
  businessName: string;
  ownerName: string;
  avatarUrl?: string | null;
}

/** Navegação lateral — só aparece a partir de md (tablet/desktop). */
export function Sidebar({ businessName, ownerName, avatarUrl }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-1.5 border-r border-[#e2d6c2] bg-muted px-4.5 py-7 md:flex">
      <Brand name={businessName} className="px-2 pb-7" />

      <nav aria-label="Menu principal" className="flex flex-col gap-1.5">
        {sidebarItems.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[46px] items-center gap-3 rounded-[14px] px-3.5 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle",
                active && "bg-primary font-semibold text-on-primary shadow-primary hover:bg-primary",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-[18px] bg-subtle p-3.5">
        <Avatar name={ownerName} src={avatarUrl} color="#C0643A" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ownerName}</p>
          <p className="text-xs text-ink-muted">Proprietário</p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
