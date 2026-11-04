import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireOwner } from "@/features/auth/session";

/** Toda rota dentro de (app) exige login e ganha a casca de navegação. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const owner = await requireOwner();

  return (
    <AppShell businessName={owner.businessName} ownerName={owner.fullName} avatarUrl={owner.avatarUrl}>
      {children}
    </AppShell>
  );
}
