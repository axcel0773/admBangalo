import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { listChalets } from "@/features/chalets";
import { createFee, FeeForm } from "@/features/fees";

export const metadata: Metadata = { title: "Nova taxa" };

export default async function NewFeePage() {
  const chalets = await listChalets();
  const chaletOptions = chalets.map((chalet) => ({ value: chalet.id, label: chalet.name }));

  return (
    <>
      <PageHeader title="Nova taxa" back={{ href: routes.fees, label: "Taxas" }} />
      <PageBody className="max-w-3xl">
        <FeeForm action={createFee} chaletOptions={chaletOptions} />
      </PageBody>
    </>
  );
}
