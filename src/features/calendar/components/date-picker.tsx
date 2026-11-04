"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { paths } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { IsoDate } from "@/lib/dates";

import { buildMonthGrid, shiftCalendarMonth } from "../domain";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

interface DatePickerProps {
  selected: IsoDate;
  today: IsoDate;
  /** Conteúdo do botão que abre o calendário. */
  children: ReactNode;
  /** Nome acessível do botão. */
  label?: string;
  className?: string;
}

/**
 * Toque na data/semana → calendário do mês para escolher qualquer dia.
 * Celular: folha que sobe de baixo. Desktop: janela no centro. Usa <dialog> nativo
 * (foco preso, Esc fecha, leitor de tela anuncia como diálogo).
 */
export function DatePicker({ selected, today, children, label = "Escolher data no calendário", className }: DatePickerProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [month, setMonth] = useState(selected);
  const weeks = buildMonthGrid(month, today, selected);
  const title = monthFormatter.format(new Date(`${month.slice(0, 7)}-01T00:00:00Z`));

  function open() {
    setMonth(selected);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function pick(date: IsoDate) {
    close();
    router.push(paths.calendar({ start: date, day: date }));
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl text-left transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-primary",
          className,
        )}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="date-picker-title"
        onClick={(event) => {
          // Toque fora da folha (no fundo escuro) fecha.
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-x-0 bottom-0 m-0 mt-auto w-full max-w-none rounded-t-[28px] bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40 md:inset-0 md:m-auto md:max-w-sm md:rounded-[28px]"
      >
        <div className="flex flex-col gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-5">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => setMonth(shiftCalendarMonth(month, -1))}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <h2 id="date-picker-title" className="font-display text-lg font-semibold capitalize" aria-live="polite">
              {title}
            </h2>
            <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => setMonth(shiftCalendarMonth(month, 1))}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>

          <table className="w-full table-fixed border-separate border-spacing-1 text-center" role="grid">
            <thead>
              <tr>
                {WEEKDAYS.map((letter, index) => (
                  <th key={WEEKDAY_NAMES[index]} scope="col" abbr={WEEKDAY_NAMES[index]} className="text-[11px] font-semibold text-ink-muted">
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week[0]?.date}>
                  {week.map((cell) => (
                    <td key={cell.date} className="p-0">
                      <button
                        type="button"
                        onClick={() => pick(cell.date)}
                        aria-label={dayFormatter.format(new Date(`${cell.date}T00:00:00Z`))}
                        aria-current={cell.isSelected ? "date" : undefined}
                        className={cn(
                          "flex aspect-square w-full min-h-10 items-center justify-center rounded-2xl text-[15px] font-semibold tabular-nums transition-colors",
                          cell.isSelected
                            ? "bg-primary text-on-primary"
                            : cell.isToday
                              ? "bg-primary-soft text-primary-ink"
                              : cell.inMonth
                                ? "text-ink hover:bg-subtle"
                                : "text-ink-muted/50 hover:bg-subtle",
                        )}
                      >
                        {cell.dayNumber}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={close}>
              <X aria-hidden="true" />
              Fechar
            </Button>
            <Button onClick={() => pick(today)}>
              <CalendarDays aria-hidden="true" />
              Hoje
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
