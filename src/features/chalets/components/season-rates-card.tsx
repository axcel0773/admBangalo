import { X } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import type { SeasonRate } from "@/features/reservations/domain/seasons";
import { addDays, formatShortDate, type IsoDate } from "@/lib/dates";
import { formatCurrency, pluralize } from "@/lib/format";

import { createSeasonRate, deleteSeasonRate } from "../actions";
import { SeasonRateForm } from "./season-rate-form";

interface SeasonRatesCardProps {
  chaletId: string;
  baseRate: number;
  seasons: SeasonRate[];
  today: IsoDate;
}

/** Diárias diferentes por período (feriados, férias). Fora delas vale a diária base. */
export function SeasonRatesCard({ chaletId, baseRate, seasons, today }: SeasonRatesCardProps) {
  return (
    <CardSection title="Tarifas por temporada" titleId="season-rates">
      <p className="mb-3 text-sm text-ink-muted">
        Fora das temporadas vale a diária base ({formatCurrency(baseRate)}). Na nova reserva, cada noite usa a diária
        do período em que cai.
      </p>

      {seasons.length > 0 ? (
        <ul className="mb-3 divide-y divide-line">
          {seasons.map((season) => {
            const past = season.end <= today;
            return (
              <li key={season.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {season.label}
                    {past ? <Badge tone="neutral">encerrada</Badge> : null}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    noites de {formatShortDate(season.start)} a {formatShortDate(addDays(season.end, -1))}
                    {season.min_nights > 1 ? ` · mínimo ${pluralize(season.min_nights, "noite", "noites")}` : ""}
                  </span>
                </span>
                <span className="text-[15px] font-bold tabular-nums">{formatCurrency(season.nightly_rate)}</span>
                <ActionForm action={deleteSeasonRate.bind(null, chaletId, season.id)} className="contents">
                  <ConfirmSubmit
                    message={`Remover a temporada “${season.label}”? Reservas já feitas não mudam.`}
                    confirmLabel="Remover"
                    pendingLabel="Removendo…"
                    triggerSize="icon"
                    triggerLabel={`Remover ${season.label}`}
                    block={false}
                    className="size-11 text-ink-muted md:size-9"
                  >
                    <X aria-hidden="true" />
                  </ConfirmSubmit>
                </ActionForm>
              </li>
            );
          })}
        </ul>
      ) : null}

      <SeasonRateForm action={createSeasonRate.bind(null, chaletId)} baseRate={baseRate} />
    </CardSection>
  );
}
