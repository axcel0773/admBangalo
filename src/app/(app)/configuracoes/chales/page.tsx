import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { ChaletList, listChalets } from "@/features/chalets";

export const metadata: Metadata = { title: "Bangalôs" };

export default async function ChaletsPage() {
  const chalets = await listChalets();

  return (
    <>
      <PageHeader
        title="Bangalôs"
        back={{ href: routes.settings, label: "Configurações" }}
        actions={
          chalets.length > 0 ? (
            <ButtonLink href={routes.newChalet} size="sm">
              <Plus aria-hidden="true" />
              Novo bangalô
            </ButtonLink>
          ) : null
        }
      />
      <PageBody className="max-w-3xl">
        <ChaletList chalets={chalets} />
      </PageBody>
    </>
  );
}
