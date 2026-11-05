import { TriangleAlert } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

import { changeQuoteStatus } from "../actions";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "../domain/status";
import { QuoteStatusBadge } from "./quote-status-badge";

/** Próximos passos de cada situação; o primeiro botão é o principal. */
const NEXT_STEPS: Record<QuoteStatus, { to: QuoteStatus; label: string }[]> = {
  draft: [
    { to: "sent", label: "Marcar como enviado" },
    { to: "declined", label: "Recusado" },
  ],
  sent: [
    { to: "accepted", label: "Aceito" },
    { to: "declined", label: "Recusado" },
  ],
  accepted: [{ to: "sent", label: "Voltar para enviado" }],
  declined: [{ to: "sent", label: "Reabrir (enviado)" }],
};

interface QuoteStatusCardProps {
  quote: { id: string; status: QuoteStatus; valid_until: string };
  today: string;
  /** As datas já foram ocupadas por outra reserva. */
  datesTaken: boolean;
}

export function QuoteStatusCard({ quote, today, datesTaken }: QuoteStatusCardProps) {
  return (
    <CardSection title="Situação" titleId="quote-status" action={<QuoteStatusBadge quote={quote} today={today} />}>
      {datesTaken ? (
        <p
          role="status"
          className="mb-3 flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-sm font-semibold text-accent-ink"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Estas datas já foram ocupadas por outra reserva. Avise o hóspede antes de confirmar.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        {NEXT_STEPS[quote.status].map((step, index) => (
          <ActionForm key={step.to} action={changeQuoteStatus.bind(null, quote.id, step.to)} className="flex-1 sm:flex-none">
            {index === 0 ? (
              <SubmitButton block pendingLabel="Atualizando…">
                {step.label}
              </SubmitButton>
            ) : (
              <Button type="submit" variant="secondary" block aria-label={`Marcar como ${QUOTE_STATUS_LABELS[step.to].toLowerCase()}`}>
                {step.label}
              </Button>
            )}
          </ActionForm>
        ))}
      </div>
    </CardSection>
  );
}
