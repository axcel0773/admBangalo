import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ChaletForm, getChalet, updateChalet } from "@/features/chalets";

export const metadata: Metadata = { title: "Editar chalé" };

export default async function EditChaletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chalet = await getChalet(id);
  if (!chalet) notFound();

  return (
    <>
      <PageHeader title={chalet.name} back={{ href: routes.chalets, label: "Chalés" }} />
      <PageBody className="max-w-3xl">
        <ChaletForm action={updateChalet.bind(null, chalet.id)} chalet={chalet} />
      </PageBody>
    </>
  );
}
