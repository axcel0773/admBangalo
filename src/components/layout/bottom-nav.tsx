"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import { NewMenu } from "./new-menu";
import { bottomNavItems, isActivePath, type NavItem } from "./navigation";

function BottomNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, label, icon: Icon } = item;
  const active = isActivePath(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] text-ink-muted",
        active && "font-bold text-primary-ink",
      )}
    >
      <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
      {label}
    </Link>
  );
}

/** Barra inferior fixa — navegação principal no celular (some a partir de md). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="pb-safe keyboard-hide fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center rounded-t-3xl border-t border-line bg-surface px-2.5 pt-2 shadow-[0_-6px_20px_rgb(80_55_30/0.06)] md:hidden"
    >
      {bottomNavItems.left.map((item) => (
        <BottomNavLink key={item.href} item={item} pathname={pathname} />
      ))}

      <NewMenu />

      {bottomNavItems.right.map((item) => (
        <BottomNavLink key={item.href} item={item} pathname={pathname} />
      ))}
    </nav>
  );
}
