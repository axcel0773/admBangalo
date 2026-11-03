import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { listChalets } from "@/features/chalets";
import { FeeForm, getFee, updateFee } from "@/features/fees";

export const metadata: Metadata = { title: "Editar taxa" };

export default async function EditFeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [fee, chalets] = await Promise.all([getFee(id), listChalets()]);
  if (!fee) notFound();

  const chaletOptions = chalets.map((chalet) => ({ value: chalet.id, label: chalet.name }));

  return (
    <>
      <PageHeader title={fee.name} back={{ href: routes.fees, label: "Taxas" }} />
      <PageBody className="max-w-3xl">
        <FeeForm action={updateFee.bind(null, fee.id)} chaletOptions={chaletOptions} fee={fee} />
      </PageBody>
    </>
  );
}
