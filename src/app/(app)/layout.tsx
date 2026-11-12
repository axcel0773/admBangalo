import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { requireOwner } from "@/features/auth/session";

/** Toda rota dentro de (app) exige login e ganha a casca de navegação. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const owner = await requireOwner();

  return (
    <AppShell businessName={owner.businessName} ownerName={owner.fullName} avatarUrl={owner.avatarUrl}>
      <OfflineBanner renderedAt={new Date().toISOString()} />
      {children}
    </AppShell>
  );
}
