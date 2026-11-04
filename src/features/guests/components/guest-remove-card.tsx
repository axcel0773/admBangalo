import { ShieldCheck, Trash2 } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";

import { removeGuest } from "../actions";

interface GuestRemoveCardProps {
  guestId: string;
  hasStays: boolean;
  removed: boolean;
}

/**
 * Excluir o hóspede. Sem estadias o cadastro some; com estadias os dados pessoais
 * são apagados (LGPD) e ele sai da lista, mas reservas e pagamentos ficam no financeiro.
 */
export function GuestRemoveCard({ guestId, hasStays, removed }: GuestRemoveCardProps) {
  if (removed) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-canvas px-4 py-3 text-sm text-ink-muted">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        Hóspede excluído. As reservas dele continuam no financeiro, sem dados pessoais.
      </p>
    );
  }

  return (
    <CardSection title="Excluir hóspede" titleId="guest-remove">
      <p className="mb-3 text-sm text-ink-muted">
        {hasStays
          ? "Ele sai da lista e nome, CPF, telefone, e-mail e observações são apagados. As reservas e pagamentos continuam no financeiro, sem identificar a pessoa."
          : "O cadastro é apagado de vez."}{" "}
        Não dá para desfazer.
      </p>
      <ActionForm action={removeGuest.bind(null, guestId)}>
        <ConfirmSubmit
          message="Excluir este hóspede? Não dá para desfazer."
          confirmLabel="Sim, excluir"
          pendingLabel="Excluindo…"
          triggerVariant="secondary"
        >
          <Trash2 aria-hidden="true" />
          Excluir hóspede
        </ConfirmSubmit>
      </ActionForm>
    </CardSection>
  );
}
