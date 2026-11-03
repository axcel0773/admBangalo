import Link from "next/link";

import { paths } from "@/components/layout/navigation";
import { cn } from "@/lib/cn";
import type { IsoDate } from "@/lib/dates";

import { occupiedChaletIds, type CalendarChalet, type CalendarDay, type CalendarStay } from "../domain";

interface WeekStripProps {
  days: CalendarDay[];
  start: IsoDate;
  selected: IsoDate;
  chalets: CalendarChalet[];
  stays: CalendarStay[];
}

/** Celular: 7 dias para tocar, com um ponto por chalé ocupado na noite. */
export function WeekStrip({ days, start, selected, chalets, stays }: WeekStripProps) {
  const colorById = new Map(chalets.map((chalet) => [chalet.id, chalet.color]));

  return (
    <nav aria-label="Dias da semana" className="grid grid-cols-7 gap-1.5 rounded-[22px] bg-surface p-2 shadow-card">
      {days.map((day) => {
        const active = day.date === selected;
        const occupied = occupiedChaletIds(stays, day.date);
        return (
          <Link
            key={day.date}
            href={paths.calendar({ start, day: day.date })}
            aria-current={active ? "date" : undefined}
            aria-label={`${day.weekday} ${day.dayNumber}, ${occupied.length} de ${chalets.length} chalés ocupados`}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 rounded-2xl",
              active ? "bg-primary text-on-primary shadow-[0_8px_18px_rgb(74_107_58/0.3)]" : day.isWeekend && "bg-subtle",
            )}
          >
            <span
              className={cn(
                "text-[10px] tracking-wide uppercase",
                active ? "text-[#cfdcc2]" : day.isWeekend ? "text-accent-ink" : "text-ink-muted",
              )}
            >
              {day.weekday}
            </span>
            <span className={cn("font-display text-lg leading-none font-semibold", day.isToday && !active && "text-primary-ink underline underline-offset-4")}>
              {day.dayNumber}
            </span>
            <span className="flex h-1.5 gap-0.5" aria-hidden="true">
              {occupied.slice(0, 4).map((chaletId, index) => (
                <span
                  key={`${chaletId}-${index}`}
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: active ? "#fffdf8" : (colorById.get(chaletId) ?? "#4A6B3A") }}
                />
              ))}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
