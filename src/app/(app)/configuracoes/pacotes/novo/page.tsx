import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { createPackage, PackageForm } from "@/features/packages";

export const metadata: Metadata = { title: "Novo pacote" };

export default function NewPackagePage() {
  return (
    <>
      <PageHeader title="Novo pacote" back={{ href: routes.packages, label: "Pacotes" }} />
      <PageBody className="max-w-3xl">
        <PackageForm action={createPackage} />
      </PageBody>
    </>
  );
}
