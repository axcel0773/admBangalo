import { FileText } from "lucide-react";

import { paths, routes } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";
import { ListCard, ListRow } from "@/components/ui/list-row";
import { formatShortDate, todayIso } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

import type { QuoteListItem } from "../services";

export function QuoteList({ quotes }: { quotes: QuoteListItem[] }) {
  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={<FileText />}
        title="Nenhum orçamento ainda"
        description="Simule uma hospedagem e envie o orçamento em PDF para o hóspede."
        action={<ButtonLink href={routes.newQuote}>Novo orçamento</ButtonLink>}
      />
    );
  }

  const today = todayIso();
  return (
    <ListCard>
      {quotes.map((quote) => {
        const expired = quote.valid_until < today;
        return (
          <ListRow
            key={quote.id}
            href={paths.quote(quote.id)}
            leading={<IconTile tone="neutral"><FileText /></IconTile>}
            title={quote.guest_name}
            subtitle={`${quote.chaletName} · ${formatShortDate(quote.check_in)} a ${formatShortDate(quote.check_out)}`}
            trailing={
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-semibold">{formatCurrency(quote.total)}</span>
                <Badge tone={expired ? "danger" : "success"}>{expired ? "Vencido" : "Válido"}</Badge>
              </div>
            }
          />
        );
      })}
    </ListCard>
  );
}
