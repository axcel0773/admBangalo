import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ChaletForm, createChalet } from "@/features/chalets";

export const metadata: Metadata = { title: "Novo bangalô" };

export default function NewChaletPage() {
  return (
    <>
      <PageHeader title="Novo bangalô" back={{ href: routes.chalets, label: "Bangalôs" }} />
      <PageBody className="max-w-3xl">
        <ChaletForm action={createChalet} />
      </PageBody>
    </>
  );
}
