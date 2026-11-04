import { CalendarOff, ChevronDown, ChevronRight, House, Plus } from "lucide-react";
import Link from "next/link";

import { paths } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyRounded, pluralize } from "@/lib/format";
import { formatDayMonth, formatLongDate, type IsoDate } from "@/lib/dates";

import type { ChaletDayEntry } from "../domain";
import { DatePicker } from "./date-picker";

const STATE_LABEL: Record<ChaletDayEntry["state"], string> = {
  arriving: "Entrada",
  leaving: "Saída",
  turnover: "Troca de hóspedes",
  staying: "Hospedado",
  blocked: "Bloqueado",
  free: "Livre",
};

function EntryCard({ entry, day }: { entry: ChaletDayEntry; day: IsoDate }) {
  const { chalet, state, stay, leavingStay, block } = entry;

  if (state === "blocked" && block) {
    return (
      <div className="flex min-h-16 items-center gap-3 rounded-[20px] bg-subtle px-4 py-3 text-ink-soft">
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-muted">
          <CalendarOff className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-ink">{chalet.name}</span>
          <span className="block text-xs">
            {block.source === "manual" ? `Bloqueado · ${block.reason}` : `Ocupado no ${block.reason}`} · até{" "}
            {formatDayMonth(block.ends_on)}
            {stay ? ` · sai ${stay.main_guest_name}` : ""}
          </span>
        </span>
      </div>
    );
  }

  if (state === "free" || !stay) {
    return (
      <Link
        href={paths.newReservation({ chalet: chalet.id, checkIn: day })}
        className="flex min-h-16 items-center gap-3 rounded-[20px] border-2 border-dashed border-line-strong px-4 py-3 text-ink-soft"
      >
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-subtle" style={{ color: chalet.color }}>
          <House className="size-6" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-ink">{chalet.name}</span>
          <span className="block text-xs">Livre · toque para reservar</span>
        </span>
        <Plus className="size-5 text-primary" aria-hidden="true" />
      </Link>
    );
  }

  const label = STATE_LABEL[state];

  return (
    <Link
      href={paths.reservation(stay.reservation_id)}
      className="flex items-center gap-3 rounded-[20px] bg-surface px-4 py-3.5 text-ink shadow-card"
    >
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-on-primary"
        style={{ backgroundColor: chalet.color }}
      >
        <House className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold tracking-wide uppercase" style={{ color: chalet.color }}>
          {chalet.name} · {label}
        </span>
        <span className="block truncate text-[15px] font-bold">{stay.main_guest_name}</span>
        <span className="block text-xs text-ink-muted">
          {state === "leaving"
            ? `sai hoje · ${pluralize(stay.guests_count, "pessoa", "pessoas")}`
            : `até ${formatDayMonth(stay.check_out)} · ${pluralize(stay.guests_count, "pessoa", "pessoas")}`}
          {leavingStay ? ` · sai ${leavingStay.main_guest_name}` : ""}
        </span>
      </span>
      {stay.balance_due > 0 ? (
        <Badge tone="warning">{formatCurrencyRounded(stay.balance_due)}</Badge>
      ) : (
        <ChevronRight className="size-5 text-ink-muted/50" aria-hidden="true" />
      )}
    </Link>
  );
}

export function DayAgenda({ entries, day, today }: { entries: ChaletDayEntry[]; day: IsoDate; today: IsoDate }) {
  const occupied = entries.filter((entry) => !["free", "leaving", "blocked"].includes(entry.state)).length;
  const title = formatLongDate(day);

  return (
    <section aria-labelledby="day-agenda-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="day-agenda-title" className="min-w-0 font-display text-xl font-semibold">
          <DatePicker selected={day} today={today} label={`${title}: escolher outro dia no calendário`} className="-ml-1 px-1 py-0.5">
            <span className="truncate first-letter:uppercase">{title}</span>
            <ChevronDown className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          </DatePicker>
        </h2>
        <span className="shrink-0 text-xs font-semibold text-ink-muted">
          {occupied} de {entries.length} ocupados
        </span>
      </div>
      {entries.map((entry) => (
        <EntryCard key={entry.chalet.id} entry={entry} day={day} />
      ))}
    </section>
  );
}
