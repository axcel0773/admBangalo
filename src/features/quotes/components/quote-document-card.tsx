import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

import type { QuoteDocument } from "../domain/quote-document";

/** O orçamento como o hóspede recebe: mesmas linhas do PDF. */
export function QuoteDocumentCard({ doc }: { doc: QuoteDocument }) {
  return (
    <Card className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">nº {doc.number} · emitido em {doc.issuedAt}</p>
          <h2 className="font-display text-xl font-semibold break-words">{doc.guestName}</h2>
        </div>
        <Badge tone={doc.expired ? "danger" : "success"}>
          {doc.expired ? `Venceu em ${doc.validUntil}` : `Válido até ${doc.validUntil}`}
        </Badge>
      </div>

      <p className="text-sm text-ink-soft">
        {doc.stay} · {doc.people}
      </p>

      <ul className="divide-y divide-line border-y border-line">
        {doc.items.map((item, index) => (
          <li key={`${index}-${item.description}`} className="flex items-start justify-between gap-4 py-2.5 text-sm">
            <span className="min-w-0 break-words">{item.description}</span>
            <span className="shrink-0 font-semibold tabular-nums">{item.pending ? "A calcular" : formatCurrency(item.amount)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <span className="font-semibold">Total</span>
        <span className="font-display text-2xl font-semibold">{formatCurrency(doc.total)}</span>
      </div>

      {doc.deposit > 0 ? (
        <div className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2.5 text-sm text-primary-ink">
          <span className="font-semibold">Sinal para garantir a reserva</span>
          <span className="font-semibold tabular-nums">{formatCurrency(doc.deposit)}</span>
        </div>
      ) : null}

      {doc.notes ? <p className="rounded-xl bg-subtle p-3 text-sm text-ink-soft">{doc.notes}</p> : null}
    </Card>
  );
}
