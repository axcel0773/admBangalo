import type { ReactNode } from "react";

import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  businessName: string;
  ownerName: string;
  children: ReactNode;
}

/**
 * Casca do app, mobile first:
 * - celular: conteúdo em tela cheia + barra inferior fixa;
 * - md+: barra lateral à esquerda, conteúdo com largura máxima.
 */
export function AppShell({ businessName, ownerName, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar businessName={businessName} ownerName={ownerName} />
      <main className="pb-safe-nav pt-safe px-safe min-w-0 flex-1 md:pb-14">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
