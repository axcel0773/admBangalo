import { ChaletLandscape, toneFromColor } from "@/components/illustrations/chalet-landscape";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { formatDayMonth } from "@/lib/dates";
import { formatCurrencyRounded, formatPercent, pluralize } from "@/lib/format";

import type { ChaletDayStatus, ChaletOverview } from "../domain/types";

const statusBadge: Record<ChaletDayStatus, { label: string; tone: BadgeTone }> = {
  arriving: { label: "Chegada hoje", tone: "success" },
  occupied: { label: "Ocupado", tone: "success" },
  leaving: { label: "Saída hoje", tone: "warning" },
  free: { label: "Livre", tone: "neutral" },
};

export function ChaletCard({ chalet }: { chalet: ChaletOverview }) {
  const badge = statusBadge[chalet.status];

  return (
    <article className="w-[78%] shrink-0 snap-start overflow-hidden rounded-card bg-surface shadow-card md:w-auto">
      <div className="aspect-[8/3]">
        {chalet.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do Storage, já reduzida no envio
          <img src={chalet.photoUrl} alt={`Foto de ${chalet.name}`} className="size-full object-cover" />
        ) : (
          <ChaletLandscape tone={toneFromColor(chalet.color)} />
        )}
      </div>
      <div className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold md:text-xl">{chalet.name}</h3>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>

        {chalet.guestName ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={chalet.guestName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{chalet.guestName}</p>
              <p className="text-xs text-ink-muted">
                {pluralize(chalet.guests, "pessoa", "pessoas")}
                {chalet.checkOut ? ` · até ${formatDayMonth(chalet.checkOut)}` : null}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Sem hóspedes hoje.</p>
        )}

        <div className="flex justify-between border-t border-line pt-3 text-xs text-ink-muted">
          <span>
            até {chalet.maxGuests} · {formatCurrencyRounded(chalet.nightlyRate)}/noite
          </span>
          <span className="font-semibold text-ink">{formatPercent(chalet.monthOccupancy)} no mês</span>
        </div>
      </div>
    </article>
  );
}
