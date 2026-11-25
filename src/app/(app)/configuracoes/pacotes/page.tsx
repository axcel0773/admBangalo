import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { listPackages, PackageList } from "@/features/packages";

export const metadata: Metadata = { title: "Pacotes" };

export default async function PackagesPage() {
  const packages = await listPackages();

  return (
    <>
      <PageHeader
        title="Pacotes"
        description="Valores fechados que você usa sempre. Na reserva e no orçamento é só tocar no pacote."
        back={{ href: routes.settings, label: "Configurações" }}
        actions={
          packages.length > 0 ? (
            <ButtonLink href={routes.newPackage} size="sm">
              <Plus aria-hidden="true" />
              Novo pacote
            </ButtonLink>
          ) : null
        }
      />
      <PageBody className="max-w-3xl">
        <PackageList packages={packages} />
      </PageBody>
    </>
  );
}
