import { ShieldCheck } from "lucide-react";

import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";

import { anonymizeGuest } from "../actions";
import { ANONYMIZED_GUEST_NAME } from "../domain";

/** LGPD: o hóspede pode pedir a exclusão dos dados pessoais; o financeiro fica. */
export function GuestPrivacyCard({ guestId, fullName }: { guestId: string; fullName: string }) {
  if (fullName === ANONYMIZED_GUEST_NAME) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-canvas px-4 py-3 text-sm text-ink-muted">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        Dados pessoais apagados a pedido do hóspede.
      </p>
    );
  }

  return (
    <CardSection title="Privacidade" titleId="guest-privacy">
      <p className="mb-3 text-sm text-ink-muted">
        Se o hóspede pedir (LGPD), apague nome, CPF, telefone, e-mail e observações. Reservas e pagamentos continuam no
        financeiro, sem identificar a pessoa. Não dá para desfazer.
      </p>
      <form action={anonymizeGuest.bind(null, guestId)}>
        <ConfirmSubmit
          message="Apagar os dados pessoais deste hóspede? Não dá para desfazer."
          confirmLabel="Sim, apagar"
          pendingLabel="Apagando…"
          triggerVariant="secondary"
        >
          Apagar dados pessoais
        </ConfirmSubmit>
      </form>
    </CardSection>
  );
}
