import { Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { routes } from "@/components/layout/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { formatLongDate, type IsoDate } from "@/lib/dates";
import { pluralize } from "@/lib/format";

import type { AgendaEvent } from "../domain/types";

interface DashboardHeaderProps {
  greeting: string;
  ownerName: string;
  avatarUrl?: string | null;
  today: IsoDate;
  agenda: AgendaEvent[];
}

function agendaSentence(agenda: AgendaEvent[]): string {
  const arrivals = agenda.filter((e) => e.type === "check-in").length;
  const departures = agenda.length - arrivals;
  if (agenda.length === 0) return "Nenhuma entrada ou saída hoje.";
  const parts = [
    arrivals ? `${arrivals === 1 ? "chega" : "chegam"} ${pluralize(arrivals, "reserva", "reservas")}` : null,
    departures ? `${departures === 1 ? "sai" : "saem"} ${pluralize(departures, "hóspede", "hóspedes")}` : null,
  ].filter(Boolean);
  return `Hoje ${parts.join(" e ")}.`;
}

/**
 * Celular: faixa verde com paisagem e saudação.
 * Desktop: cabeçalho de página com ações.
 */
export function DashboardHeader({ greeting, ownerName, avatarUrl, today, agenda }: DashboardHeaderProps) {
  const firstName = ownerName.split(" ")[0] ?? ownerName;
  const dateLabel = formatLongDate(today);

  return (
    <>
      <header className="relative h-48 overflow-hidden bg-primary-strong text-on-primary md:hidden">
        <svg
          viewBox="0 0 390 196"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <circle cx="250" cy="122" r="20" fill="#FFD98A" opacity="0.95" />
          <path d="M0 148q50-14 100 0t100 0 100 0 90 0v48H0z" fill="#14508A" opacity="0.55" />
          <path d="M0 166q50-14 100 0t100 0 100 0 90 0v30H0z" fill="#14508A" opacity="0.85" />
          <path d="M342 190c0-30 2-60 10-96" stroke="#0E3A63" strokeWidth="5" fill="none" strokeLinecap="round" />
          <g stroke="#0E3A63" strokeWidth="5" fill="none" strokeLinecap="round">
            <path d="M352 94c-14-14-30-14-42-6M352 94c14-14 30-14 42-6M352 94c-10-20-26-24-38-20M352 94c10-20 26-24 38-20" />
          </g>
        </svg>
        <div className="relative flex items-start justify-between p-5">
          <div>
            <p className="text-[13px] text-[#cfe2f3] first-letter:uppercase">{dateLabel}</p>
            <h1 className="mt-1 font-display text-[30px] leading-tight font-semibold">
              {greeting},
              <br />
              {firstName}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="photo" />
            <Link href={routes.settings} aria-label="Configurações da conta">
              <Avatar name={ownerName} src={avatarUrl} color="#F29A3E" size="md" className="ring-3 ring-white/35" />
            </Link>
          </div>
        </div>
      </header>

      <PageHeader
        className="hidden md:flex"
        eyebrow={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
        title={`${greeting}, ${firstName}`}
        description={agendaSentence(agenda)}
        actions={
          <>
            <ButtonLink href={routes.calendar} variant="secondary">
              Ver calendário
            </ButtonLink>
            <ButtonLink href={routes.newReservation}>
              <Plus aria-hidden="true" />
              Nova reserva
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
