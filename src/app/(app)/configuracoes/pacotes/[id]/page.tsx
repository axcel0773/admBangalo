import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { getPackage, PackageForm, updatePackage } from "@/features/packages";
import { isUuid } from "@/lib/ids";

export const metadata: Metadata = { title: "Editar pacote" };

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = isUuid(id) ? await getPackage(id) : null;
  if (!pkg) notFound();

  return (
    <>
      <PageHeader title={pkg.name} back={{ href: routes.packages, label: "Pacotes" }} />
      <PageBody className="max-w-3xl">
        <PackageForm action={updatePackage.bind(null, pkg.id)} pkg={pkg} />
      </PageBody>
    </>
  );
}
