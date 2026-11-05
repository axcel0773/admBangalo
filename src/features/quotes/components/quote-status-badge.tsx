import { Badge } from "@/components/ui/badge";

import { displayStatus, QUOTE_DISPLAY_LABELS, QUOTE_DISPLAY_TONES, type QuoteStatus } from "../domain/status";

/** Situação do orçamento (já considera "Vencido"). */
export function QuoteStatusBadge({ quote, today }: { quote: { status: QuoteStatus; valid_until: string }; today: string }) {
  const shown = displayStatus(quote, today);
  return <Badge tone={QUOTE_DISPLAY_TONES[shown]}>{QUOTE_DISPLAY_LABELS[shown]}</Badge>;
}
