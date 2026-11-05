import { Trash2 } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";

import { deleteQuote } from "../actions";

export function DeleteQuoteCard({ quoteId }: { quoteId: string }) {
  return (
    <CardSection title="Excluir orçamento" titleId="quote-delete">
      <p className="mb-3 text-sm text-ink-muted">Remove o orçamento da lista. Não afeta reservas nem o calendário.</p>
      <ActionForm action={deleteQuote.bind(null, quoteId)}>
        <ConfirmSubmit
          message="Excluir este orçamento? Não dá para desfazer."
          confirmLabel="Sim, excluir"
          pendingLabel="Excluindo…"
          triggerVariant="secondary"
        >
          <Trash2 aria-hidden="true" />
          Excluir orçamento
        </ConfirmSubmit>
      </ActionForm>
    </CardSection>
  );
}
