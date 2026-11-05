import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { CardSection } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";

import type { AgendaEvent } from "../domain/types";

const eventCopy = {
  "check-in": { label: "Chegada", rowClass: "bg-[#e8f1fa]", hint: "text-[#2a5d8f]" },
  "check-out": { label: "Saída", rowClass: "bg-[#f9ede3]", hint: "text-accent-ink" },
} as const;

function AgendaRow({ event }: { event: AgendaEvent }) {
  const copy = eventCopy[event.type];
  return (
    <li>
      <Link
        href={`${routes.reservations}/${event.reservationId}`}
        className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-ink", copy.rowClass)}
      >
        <span className="w-11 shrink-0 text-[13px] font-semibold text-ink-muted">{event.time}</span>
        <Avatar name={event.guestName} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {copy.label} · {event.guestName}
          </span>
          <span className={cn("block text-xs", copy.hint)}>
            {event.chaletName} · {pluralize(event.guests, "pessoa", "pessoas")}
          </span>
        </span>
        <ChevronRight className="size-5 text-ink-muted/60" aria-hidden="true" />
      </Link>
    </li>
  );
}

export function TodayAgenda({ events }: { events: AgendaEvent[] }) {
  return (
    <CardSection title="Hoje" titleId="agenda-title">
      {events.length === 0 ? (
        <p className="py-4 text-sm text-ink-muted">Nenhuma entrada ou saída hoje.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {events.map((event) => (
            <AgendaRow key={`${event.type}-${event.reservationId}`} event={event} />
          ))}
        </ul>
      )}
    </CardSection>
  );
}
