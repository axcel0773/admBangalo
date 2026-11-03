import { Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { routes } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { formatLongDate, type IsoDate } from "@/lib/dates";
import { pluralize } from "@/lib/format";

import type { AgendaEvent } from "../domain/types";

interface DashboardHeaderProps {
  greeting: string;
  ownerName: string;
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
export function DashboardHeader({ greeting, ownerName, today, agenda }: DashboardHeaderProps) {
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
          <circle cx="318" cy="52" r="20" fill="#E8C98F" opacity="0.9" />
          <path d="M0 150 80 92l60 44 76-62 86 70 58-34 30 20v66H0z" fill="#3F5F33" />
          <path d="M0 172q100-30 200-12t190-6v42H0z" fill="#4A6B3A" />
          <path d="M26 186l14-40 14 40zM52 186l10-28 10 28zM300 186l14-44 14 44zM330 186l10-30 10 30z" fill="#2A4021" />
        </svg>
        <div className="relative flex items-start justify-between p-5">
          <div>
            <p className="text-[13px] text-[#cfdcc2] first-letter:uppercase">{dateLabel}</p>
            <h1 className="mt-1 font-display text-[30px] leading-tight font-semibold">
              {greeting},
              <br />
              {firstName}
            </h1>
          </div>
          <Link href={routes.settings} aria-label="Configurações da conta">
            <Avatar name={ownerName} color="#C0643A" size="md" className="ring-3 ring-white/35" />
          </Link>
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
