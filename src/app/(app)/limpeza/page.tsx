import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { CleaningList, listCleaningTasks } from "@/features/cleaning";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Limpeza" };

export default async function CleaningPage() {
  const today = todayIso();
  const tasks = await listCleaningTasks(today);

  return (
    <>
      <PageHeader
        title="Limpeza"
        description="Uma limpeza por saída: marque como feita e avise a faxineira pelo WhatsApp."
        back={{ href: routes.dashboard, label: "Painel" }}
      />
      <PageBody className="max-w-3xl">
        <CleaningList tasks={tasks} today={today} />
      </PageBody>
    </>
  );
}
