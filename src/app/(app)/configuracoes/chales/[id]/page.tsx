import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AvailabilityCard, getChaletAvailability } from "@/features/availability";
import { ChaletForm, getChalet, listSeasonRates, SeasonRatesCard, updateChalet } from "@/features/chalets";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Editar chalé" };

export default async function EditChaletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [chalet, seasons, availability] = await Promise.all([
    getChalet(id),
    listSeasonRates(id),
    getChaletAvailability(id),
  ]);
  if (!chalet) notFound();

  return (
    <>
      <PageHeader title={chalet.name} back={{ href: routes.chalets, label: "Chalés" }} />
      <PageBody className="flex max-w-3xl flex-col gap-6">
        <ChaletForm action={updateChalet.bind(null, chalet.id)} chalet={chalet} />
        <SeasonRatesCard chaletId={chalet.id} baseRate={chalet.base_nightly_rate} seasons={seasons} today={todayIso()} />
        <AvailabilityCard chaletId={chalet.id} availability={availability} />
      </PageBody>
    </>
  );
}
