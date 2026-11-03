import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { listChalets } from "@/features/chalets";
import { FeeList, listFees } from "@/features/fees";

export const metadata: Metadata = { title: "Taxas" };

export default async function FeesPage() {
  const [fees, chalets] = await Promise.all([listFees(), listChalets()]);
  const chaletNames = Object.fromEntries(chalets.map((chalet) => [chalet.id, chalet.name]));

  return (
    <>
      <PageHeader
        title="Taxas"
        description="Taxas automáticas entram sozinhas em toda nova reserva."
        back={{ href: routes.settings, label: "Configurações" }}
        actions={
          fees.length > 0 ? (
            <ButtonLink href={routes.newFee} size="sm">
              <Plus aria-hidden="true" />
              Nova taxa
            </ButtonLink>
          ) : null
        }
      />
      <PageBody className="max-w-3xl">
        <FeeList fees={fees} chaletNames={chaletNames} />
      </PageBody>
    </>
  );
}
