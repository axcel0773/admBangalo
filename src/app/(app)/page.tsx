import type { Metadata } from "next";

import { PageBody } from "@/components/layout/page-header";
import { requireOwner } from "@/features/auth/session";
import {
  ChaletList,
  DashboardHeader,
  getDashboard,
  ReceivablesCard,
  Shortcuts,
  SummaryCards,
  TodayActions,
  TodayAgenda,
  UpcomingArrivals,
} from "@/features/dashboard";
import { greetingFor } from "@/lib/dates";

export const metadata: Metadata = { title: "Painel" };

/** A página só compõe: dados vêm do service, desenho vem dos componentes da feature. */
export default async function DashboardPage() {
  const [owner, dashboard] = await Promise.all([requireOwner(), getDashboard()]);

  return (
    <>
      <DashboardHeader
        greeting={greetingFor()}
        ownerName={owner.fullName}
        avatarUrl={owner.avatarUrl}
        today={dashboard.today}
        agenda={dashboard.agenda}
      />

      {/* No celular os cartões sobem sobre a faixa verde do cabeçalho. */}
      <PageBody className="relative -mt-7 md:mt-0">
        <SummaryCards summary={dashboard.summary} />
        <TodayActions actions={dashboard.actions} />
        <TodayAgenda events={dashboard.agenda} />
        <ChaletList chalets={dashboard.chalets} />
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <ReceivablesCard receivables={dashboard.receivables} />
          <UpcomingArrivals arrivals={dashboard.upcoming} />
        </div>
        <Shortcuts chaletCount={dashboard.chalets.length} guestCount={dashboard.guestCount} />
      </PageBody>
    </>
  );
}
