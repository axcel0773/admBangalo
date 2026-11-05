import { Pencil, Receipt, Sparkles, Trash2, UserPlus, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { paths, routes } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/ui/action-form";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";

import { deleteFee } from "../actions";
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
    <ul className="flex flex-col gap-3">
      {fees.map((fee) => {
        const { icon, tone } = KIND_ICON[fee.kind];
        const scope = fee.chalet_id ? (chaletNames[fee.chalet_id] ?? "Bangalô removido") : "Todos os bangalôs";
        return (
          <li key={fee.id} className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <IconTile tone={tone}>{icon}</IconTile>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{fee.name}</p>
                <p className="truncate text-xs text-ink-muted">
                  {describeFeeAmount(fee)} · {scope}
                </p>
              </div>
              {!fee.active ? (
                <Badge tone="neutral">Inativa</Badge>
              ) : fee.auto_apply ? (
                <Badge tone="success">Automática</Badge>
              ) : (
                <Badge tone="neutral">Manual</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <ButtonLink href={paths.fee(fee.id)} variant="secondary" size="sm">
                <Pencil aria-hidden="true" />
                Editar
              </ButtonLink>
              <ActionForm action={deleteFee.bind(null, fee.id)} className="flex-1">
                <ConfirmSubmit
                  message={`Excluir a taxa “${fee.name}”? Reservas já criadas não mudam.`}
                  confirmLabel="Sim, excluir"
                  pendingLabel="Excluindo…"
                  triggerVariant="secondary"
                  triggerSize="sm"
                  block={false}
                >
                  <Trash2 aria-hidden="true" />
                  Excluir
                </ConfirmSubmit>
              </ActionForm>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
