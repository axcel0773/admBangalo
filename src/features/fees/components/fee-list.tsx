import { Receipt, Sparkles, UserPlus, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { paths, routes } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";
import { ListCard, ListRow } from "@/components/ui/list-row";

import { describeFeeAmount, type Fee, type FeeKind } from "../domain";

const KIND_ICON: Record<FeeKind, { icon: ReactNode; tone: "primary" | "energy" | "neutral" | "slate" }> = {
  cleaning: { icon: <Sparkles />, tone: "slate" },
  energy: { icon: <Zap />, tone: "energy" },
  extra_guest: { icon: <UserPlus />, tone: "neutral" },
  pet: { icon: <Receipt />, tone: "primary" },
  other: { icon: <Receipt />, tone: "primary" },
};

interface FeeListProps {
  fees: Fee[];
  chaletNames: Record<string, string>;
}

export function FeeList({ fees, chaletNames }: FeeListProps) {
  if (fees.length === 0) {
    return (
      <EmptyState
        icon={<Receipt />}
        title="Nenhuma taxa cadastrada"
        description="Cadastre limpeza, energia e outras taxas para que entrem sozinhas nas reservas."
        action={<ButtonLink href={routes.newFee}>Cadastrar taxa</ButtonLink>}
      />
    );
  }

  return (
    <ListCard>
      {fees.map((fee) => {
        const { icon, tone } = KIND_ICON[fee.kind];
        const scope = fee.chalet_id ? (chaletNames[fee.chalet_id] ?? "Chalé removido") : "Todos os chalés";
        return (
          <ListRow
            key={fee.id}
            href={paths.fee(fee.id)}
            leading={<IconTile tone={tone}>{icon}</IconTile>}
            title={fee.name}
            subtitle={`${describeFeeAmount(fee)} · ${scope}`}
            trailing={
              !fee.active ? (
                <Badge tone="neutral">Inativa</Badge>
              ) : fee.auto_apply ? (
                <Badge tone="success">Automática</Badge>
              ) : (
                <Badge tone="neutral">Manual</Badge>
              )
            }
          />
        );
      })}
    </ListCard>
  );
}
