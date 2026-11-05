import { FileText, NotebookTabs, Search, Users } from "lucide-react";
import type { ReactNode } from "react";

import { paths } from "@/components/layout/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";
import { ListCard, ListRow } from "@/components/ui/list-row";
import { formatStayRange } from "@/lib/dates";

import { searchTotal, type SearchResults } from "../domain";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-semibold text-ink-soft">{title}</h2>
      <ListCard>{children}</ListCard>
    </section>
  );
}

/** `hasPages`: já há atalhos de página na tela, então "nada encontrado" não é um beco sem saída. */
export function SearchResultsView({ results, hasPages = false }: { results: SearchResults; hasPages?: boolean }) {
  if (searchTotal(results) === 0) {
    if (hasPages) return null;
    return (
      <EmptyState
        icon={<Search />}
        title="Nada encontrado"
        description={`Nenhum hóspede, reserva ou orçamento com “${results.term}”. Tente outro nome, telefone ou bangalô.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {results.guests.length > 0 ? (
        <Group title="Hóspedes">
          {results.guests.map((guest) => (
            <ListRow
              key={guest.id}
              href={paths.guest(guest.id)}
              leading={<IconTile><Users /></IconTile>}
              title={guest.name}
              subtitle={guest.phone ?? "Sem telefone"}
            />
          ))}
        </Group>
      ) : null}
      {results.reservations.length > 0 ? (
        <Group title="Reservas">
          {results.reservations.map((reservation) => (
            <ListRow
              key={reservation.id}
              href={paths.reservation(reservation.id)}
              leading={<IconTile><NotebookTabs /></IconTile>}
              title={reservation.guestName}
              subtitle={`${reservation.chaletName} · ${formatStayRange(reservation.checkIn, reservation.checkOut)}`}
            />
          ))}
        </Group>
      ) : null}
      {results.quotes.length > 0 ? (
        <Group title="Orçamentos">
          {results.quotes.map((quote) => (
            <ListRow
              key={quote.id}
              href={paths.quote(quote.id)}
              leading={<IconTile tone="accent"><FileText /></IconTile>}
              title={quote.guestName}
              subtitle={formatStayRange(quote.checkIn, quote.checkOut)}
            />
          ))}
        </Group>
      ) : null}
    </div>
  );
}
