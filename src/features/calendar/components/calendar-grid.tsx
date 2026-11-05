import { CalendarOff, House } from "lucide-react";
import Link from "next/link";

import { paths } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";

import type { CalendarBlockSegment, CalendarDay, CalendarGrid as Grid, CalendarSegment } from "../domain";

const LABEL_COLUMN = "190px";

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function SegmentBar({ segment, color, row }: { segment: CalendarSegment; color: string; row: number }) {
  const { stay } = segment;
  const pending = stay.status === "pending";
  const compact = segment.span === 1;

  return (
    <Link
      href={paths.reservation(stay.reservation_id)}
      title={`${stay.main_guest_name} · ${pluralize(stay.guests_count, "pessoa", "pessoas")}`}
      className={cn(
        "relative z-10 mx-1 my-4 flex items-center gap-2 overflow-hidden rounded-full border px-1.5 text-ink",
        pending && "border-2 border-dashed bg-surface",
        segment.continuesFromBefore && "rounded-l-md",
        segment.continuesAfter && "rounded-r-md",
      )}
      style={{
        gridRow: row,
        gridColumn: `${segment.startIndex + 2} / span ${segment.span}`,
        backgroundColor: pending ? undefined : hexToRgba(color, 0.18),
        borderColor: hexToRgba(color, pending ? 0.7 : 0.35),
      }}
    >
      <Avatar name={stay.main_guest_name} size="sm" color={color} />
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold">{stay.main_guest_name}</span>
          <span className="block truncate text-[11px] text-ink-soft">
            {pluralize(stay.guests_count, "pessoa", "pessoas")}
            {pending ? " · pendente" : stay.balance_due > 0 ? " · saldo aberto" : " · pago"}
          </span>
        </span>
      ) : null}
    </Link>
  );
}

/** Bloqueio: listras cinza, sem link (manutenção ou data ocupada em outra plataforma). */
function BlockBar({ segment, row }: { segment: CalendarBlockSegment; row: number }) {
  const { block } = segment;
  const label = block.source === "manual" ? `Bloqueado · ${block.reason}` : `Ocupado no ${block.reason}`;
  return (
    <div
      title={label}
      className="relative z-10 mx-1 my-5 flex items-center gap-1.5 overflow-hidden rounded-xl border border-line-strong px-2 text-[12px] font-semibold text-ink-soft"
      style={{
        gridRow: row,
        gridColumn: `${segment.startIndex + 2} / span ${segment.span}`,
        backgroundImage:
          "repeating-linear-gradient(135deg, var(--color-muted) 0 6px, var(--color-subtle) 6px 12px)",
      }}
    >
      <CalendarOff className="size-3.5 shrink-0" aria-hidden="true" />
      {segment.span > 1 ? <span className="truncate">{label}</span> : <span className="sr-only">{label}</span>}
    </div>
  );
}

function DayHeader({ day, column }: { day: CalendarDay; column: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-0.5 text-[11px] tracking-wide uppercase"
      style={{ gridRow: 1, gridColumn: column }}
    >
      <span className={day.isWeekend ? "text-accent-ink" : "text-ink-muted"}>{day.weekday}</span>
      {day.isToday ? (
        <span className="flex size-9 items-center justify-center rounded-full bg-primary font-display text-lg text-on-primary normal-case">
          {day.dayNumber}
        </span>
      ) : (
        <span className="font-display text-xl text-ink normal-case">{day.dayNumber}</span>
      )}
    </div>
  );
}

/** Desktop/tablet: bangalôs nas linhas, dias nas colunas, reservas como barras. */
export function CalendarGrid({ grid }: { grid: Grid }) {
  const columns = `${LABEL_COLUMN} repeat(${grid.days.length}, minmax(44px, 1fr))`;
  const todayIndex = grid.days.findIndex((day) => day.isToday);

  return (
    <section aria-label="Ocupação por bangalô" className="overflow-x-auto rounded-card bg-surface p-2 shadow-card">
      <div
        className="grid min-w-[900px]"
        style={{ gridTemplateColumns: columns, gridTemplateRows: `72px repeat(${grid.rows.length}, 96px)` }}
      >
        {grid.days.map((day, index) => (
          <DayHeader key={day.date} day={day} column={index + 2} />
        ))}

        {/* Fundo: fins de semana, linha de hoje e células livres clicáveis */}
        {grid.days.map((day, index) =>
          day.isWeekend ? (
            <div
              key={`we-${day.date}`}
              aria-hidden="true"
              className="rounded-xl bg-subtle"
              style={{ gridRow: `2 / span ${grid.rows.length}`, gridColumn: index + 2 }}
            />
          ) : null,
        )}
        {todayIndex >= 0 ? (
          <div
            aria-hidden="true"
            className="pointer-events-none ml-[50%] border-l-2 border-dashed border-[#7fa9d1]"
            style={{ gridRow: `2 / span ${grid.rows.length}`, gridColumn: todayIndex + 2 }}
          />
        ) : null}

        {grid.rows.map((row, rowIndex) => {
          const gridRow = rowIndex + 2;
          return [
            <div
              key={`label-${row.chalet.id}`}
              className={cn("flex items-center gap-3 px-3", rowIndex > 0 && "border-t border-line")}
              style={{ gridRow, gridColumn: 1 }}
            >
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-[14px] text-on-primary"
                style={{ backgroundColor: row.chalet.color }}
              >
                <House className="size-5" />
              </span>
              <span>
                <span className="block font-display font-semibold">{row.chalet.name.replace(/^(Chalé|Bangalô)\s+/i, "")}</span>
                <span className="block text-xs text-ink-muted">até {row.chalet.max_guests} pessoas</span>
              </span>
            </div>,
            ...grid.days.map((day, dayIndex) => (
              <Link
                key={`cell-${row.chalet.id}-${day.date}`}
                href={paths.newReservation({ chalet: row.chalet.id, checkIn: day.date })}
                aria-label={`Reservar ${row.chalet.name} a partir de ${day.dayNumber}`}
                className={cn("group flex items-center justify-center", rowIndex > 0 && "border-t border-line")}
                style={{ gridRow, gridColumn: dayIndex + 2 }}
              >
                <span className="text-lg text-primary opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60">
                  +
                </span>
              </Link>
            )),
            ...row.blocks.map((segment) => (
              <BlockBar key={`block-${segment.block.id}`} segment={segment} row={gridRow} />
            )),
            ...row.segments.map((segment) => (
              <SegmentBar key={segment.stay.reservation_id} segment={segment} color={row.chalet.color} row={gridRow} />
            )),
          ];
        })}
      </div>
    </section>
  );
}
