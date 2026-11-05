import { Users } from "lucide-react";

import { paths, routes } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard, ListRow } from "@/components/ui/list-row";
import { formatStayRange } from "@/lib/dates";
import { pluralize } from "@/lib/format";

import { formatCityState, type GuestSummary } from "../domain";

function subtitleFor(guest: GuestSummary): string {
  const parts = [
    guest.phone,
    formatCityState(guest),
    guest.staysCount > 0 ? pluralize(guest.staysCount, "estadia", "estadias") : "sem estadias",
    guest.lastStay ? `última ${formatStayRange(guest.lastStay.check_in, guest.lastStay.check_out)}` : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

export function GuestList({ guests, searched }: { guests: GuestSummary[]; searched: boolean }) {
  if (guests.length === 0) {
    return searched ? (
      <p className="py-8 text-center text-sm text-ink-muted">Nenhum hóspede encontrado com esses filtros.</p>
    ) : (
      <EmptyState
        icon={<Users />}
        title="Nenhum hóspede ainda"
        description="Hóspedes também são cadastrados automaticamente ao criar uma reserva."
        action={<ButtonLink href={routes.newGuest}>Cadastrar hóspede</ButtonLink>}
      />
    );
  }

  return (
    <ListCard>
      {guests.map((guest) => (
        <ListRow
          key={guest.id}
          href={paths.guest(guest.id)}
          leading={<Avatar name={guest.full_name} size="lg" />}
          title={guest.full_name}
          subtitle={subtitleFor(guest)}
          trailing={
            guest.recurring || guest.birthdayThisMonth ? (
              <span className="flex flex-col items-end gap-1">
                {guest.recurring ? <Badge tone="success">Cliente fiel</Badge> : null}
                {guest.birthdayThisMonth ? <Badge tone="warning">Aniversário</Badge> : null}
              </span>
            ) : undefined
          }
        />
      ))}
    </ListCard>
  );
}
