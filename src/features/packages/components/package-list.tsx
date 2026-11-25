import { Pencil, Tag, Trash2 } from "lucide-react";

import { paths, routes } from "@/components/layout/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";

import { deletePackage } from "../actions";
import { describePackage, type StayPackage } from "../domain";

export function PackageList({ packages }: { packages: StayPackage[] }) {
  if (packages.length === 0) {
    return (
      <EmptyState
        icon={<Tag />}
        title="Nenhum pacote salvo"
        description="Salve valores fechados como “Fim de semana” ou “Feriado” para escolher com um toque na reserva e no orçamento."
        action={<ButtonLink href={routes.newPackage}>Criar pacote</ButtonLink>}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {packages.map((pkg) => (
        <li key={pkg.id} className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <IconTile>
              <Tag />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{pkg.name}</p>
              <p className="truncate text-xs text-ink-muted tabular-nums">{describePackage(pkg)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <ButtonLink href={paths.package(pkg.id)} variant="secondary" size="sm">
              <Pencil aria-hidden="true" />
              Editar
            </ButtonLink>
            <ActionForm action={deletePackage.bind(null, pkg.id)} className="flex-1">
              <ConfirmSubmit
                message={`Excluir o pacote “${pkg.name}”? Reservas e orçamentos já feitos não mudam.`}
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
      ))}
    </ul>
  );
}
