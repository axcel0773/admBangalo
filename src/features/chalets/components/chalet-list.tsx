import { House } from "lucide-react";

import { paths, routes } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard, ListRow } from "@/components/ui/list-row";
import { formatCurrency } from "@/lib/format";

import type { Chalet } from "../domain";

export function ChaletList({ chalets }: { chalets: Chalet[] }) {
  if (chalets.length === 0) {
    return (
      <EmptyState
        icon={<House />}
        title="Nenhum chalé cadastrado"
        description="Cadastre os chalés para começar a receber reservas."
        action={<ButtonLink href={routes.newChalet}>Cadastrar chalé</ButtonLink>}
      />
    );
  }

  return (
    <ListCard>
      {chalets.map((chalet) => (
        <ListRow
          key={chalet.id}
          href={paths.chalet(chalet.id)}
          leading={
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-on-primary"
              style={{ backgroundColor: chalet.color }}
            >
              <House className="size-5" />
            </span>
          }
          title={chalet.name}
          subtitle={`até ${chalet.max_guests} pessoas · ${chalet.base_guests} inclusas · ${formatCurrency(chalet.base_nightly_rate)}/noite`}
          trailing={chalet.active ? null : <Badge tone="neutral">Inativo</Badge>}
        />
      ))}
    </ListCard>
  );
}
