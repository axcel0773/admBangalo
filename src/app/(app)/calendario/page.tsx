import { CalendarDays, ChevronDown, Plus } from "lucide-react";
import type { Metadata } from "next";

import { paths } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import {
  buildCalendarGrid,
  buildDayAgenda,
  buildDays,
  CalendarGrid,
  CalendarLegend,
  DatePicker,
  DayAgenda,
  getCalendarData,
  PeriodNav,
  WeekStrip,
} from "@/features/calendar";
import { addDays, daysBetween, formatDayMonth, isIsoDate, todayIso } from "@/lib/dates";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Calendário" };

/** Desktop mostra 2 semanas; o celular, 1 semana por vez. */
const GRID_DAYS = 14;
const WEEK_DAYS = 7;

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

interface CalendarPageProps {
  searchParams: Promise<{ inicio?: string; dia?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { inicio, dia } = await searchParams;
  const today = todayIso();
  const start = inicio && isIsoDate(inicio) ? inicio : today;
  const weekEnd = addDays(start, WEEK_DAYS - 1);
  const selectedDay =
    dia && isIsoDate(dia) && daysBetween(start, dia) >= 0 && daysBetween(dia, weekEnd) >= 0
      ? dia
      : today >= start && today <= weekEnd
        ? today
        : start;

  const { chalets, stays, blocks } = await getCalendarData(start, GRID_DAYS);
  const grid = buildCalendarGrid({ chalets, stays, blocks, start, days: GRID_DAYS, today });
  const week = buildDays(start, WEEK_DAYS, today);
  const agenda = buildDayAgenda(chalets, stays, selectedDay, blocks);
  const monthLabel = monthFormatter.format(new Date(`${start}T00:00:00Z`));

  return (
    <>
      <PageHeader
        eyebrow={`${formatDayMonth(start)} – ${formatDayMonth(addDays(start, GRID_DAYS - 1))}`}
        title={monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        actions={
          <>
            <PeriodNav start={start} today={today} step={WEEK_DAYS} />
            <DatePicker
              selected={selectedDay}
              today={today}
              className="hidden h-12 rounded-control border border-line-strong bg-surface px-4 text-sm font-semibold md:inline-flex"
            >
              <CalendarDays className="size-[18px]" aria-hidden="true" />
              Ir para data
            </DatePicker>
            <ButtonLink href={paths.newReservation({ checkIn: selectedDay })} className="hidden md:inline-flex">
              <Plus aria-hidden="true" />
              Nova reserva
            </ButtonLink>
          </>
        }
      />

      <PageBody>
        {/* Celular: semana + agenda do dia */}
        <div className="flex flex-col gap-4 md:hidden">
          <DatePicker
            selected={selectedDay}
            today={today}
            label="Escolher semana e dia no calendário"
            className="-mb-1 self-start px-1 py-1 text-sm font-semibold text-ink-soft"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {formatDayMonth(start)} – {formatDayMonth(weekEnd)}
            <ChevronDown className="size-4 text-ink-muted" aria-hidden="true" />
          </DatePicker>
          <WeekStrip days={week} start={start} selected={selectedDay} chalets={chalets} stays={stays} />
          <DayAgenda entries={agenda} day={selectedDay} today={today} />
        </div>

        {/* Tablet e desktop: grade de 2 semanas */}
        <div className="hidden flex-col gap-5 md:flex">
          <CalendarGrid grid={grid} />
          <CalendarLegend />
          <p className="text-sm text-ink-muted">
            {grid.occupiedNights} de {grid.totalNights} noites ocupadas no período
            {grid.totalNights > 0 ? ` (${formatPercent(grid.occupiedNights / grid.totalNights)})` : ""}.
          </p>
        </div>
      </PageBody>
    </>
  );
}
