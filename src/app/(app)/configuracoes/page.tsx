import { FileText, House, LogOut, UserRound, Users } from "lucide-react";
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
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const [owner, chalets] = await Promise.all([requireOwner(), listChalets()]);

  return (
    <>
      <PageHeader title="Configurações" />
      <PageBody>
        <Card className="flex items-center gap-4 p-5">
          <Avatar name={owner.fullName} src={owner.avatarUrl} color="#C0643A" size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">{owner.fullName}</p>
            <p className="truncate text-sm text-ink-muted">{owner.email}</p>
          </div>
        </Card>

        <ListCard>
          <ListRow
            href={routes.chalets}
            leading={<IconTile><House /></IconTile>}
            title="Bangalôs"
            subtitle={`${pluralize(chalets.length, "bangalô cadastrado", "bangalôs cadastrados")} · capacidade, diária, horários`}
          />
          {/* Atalhos que no computador ficam no menu lateral; no celular moram aqui. */}
          <ListRow
            href={routes.guests}
            itemClassName="md:hidden"
            leading={<IconTile tone="neutral"><Users /></IconTile>}
            title="Hóspedes"
            subtitle="Cadastro, histórico e contato"
          />
          <ListRow
            href={routes.quotes}
            itemClassName="md:hidden"
            leading={<IconTile tone="neutral"><FileText /></IconTile>}
            title="Orçamentos"
            subtitle="Simulações enviadas aos hóspedes"
          />
          <ListRow
            href={routes.profile}
            leading={<IconTile tone="neutral"><UserRound /></IconTile>}
            title="Perfil"
            subtitle="Foto, nome, nome do negócio e chave Pix"
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
