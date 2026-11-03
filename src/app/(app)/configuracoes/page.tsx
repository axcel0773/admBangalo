import { House, LogOut, Receipt, UserRound } from "lucide-react";
import type { Metadata } from "next";

import { routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { ListCard, ListRow } from "@/components/ui/list-row";
import { signOut } from "@/features/auth/actions";
import { requireOwner } from "@/features/auth/session";
import { listChalets } from "@/features/chalets";
import { listFees } from "@/features/fees";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const [owner, chalets, fees] = await Promise.all([requireOwner(), listChalets(), listFees()]);
  const activeFees = fees.filter((fee) => fee.active).length;

  return (
    <>
      <PageHeader title="Configurações" />
      <PageBody>
        <Card className="flex items-center gap-4 p-5">
          <Avatar name={owner.fullName} color="#C0643A" size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">{owner.fullName}</p>
            <p className="truncate text-sm text-ink-muted">{owner.email}</p>
          </div>
        </Card>

        <ListCard>
          <ListRow
            href={routes.chalets}
            leading={<IconTile><House /></IconTile>}
            title="Chalés"
            subtitle={`${pluralize(chalets.length, "chalé cadastrado", "chalés cadastrados")} · capacidade, diária, horários`}
          />
          <ListRow
            href={routes.fees}
            leading={<IconTile tone="energy"><Receipt /></IconTile>}
            title="Taxas"
            subtitle={`${pluralize(activeFees, "taxa ativa", "taxas ativas")} · limpeza, energia, pessoa extra`}
          />
          <ListRow
            href={routes.profile}
            leading={<IconTile tone="neutral"><UserRound /></IconTile>}
            title="Perfil"
            subtitle="Seu nome, nome do negócio e chave Pix"
          />
        </ListCard>

        <form action={signOut}>
          <Button type="submit" variant="secondary" block size="lg">
            <LogOut aria-hidden="true" />
            Sair da conta
          </Button>
        </form>
      </PageBody>
    </>
  );
}
