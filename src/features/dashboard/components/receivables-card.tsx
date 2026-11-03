import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { CardSection } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/dates";

import type { Receivable } from "../domain/types";

function dueLabel({ dueStatus, dueDate }: Receivable): string {
  if (dueStatus === "today") return "vence hoje";
  if (dueStatus === "overdue") return `venceu ${formatShortDate(dueDate)}`;
  return `vence ${formatShortDate(dueDate)}`;
}

export function ReceivablesCard({ receivables }: { receivables: Receivable[] }) {
  return (
    <CardSection title="A receber" titleId="receivables-title" className="flex flex-col">
      {receivables.length === 0 ? (
        <p className="py-4 text-sm text-ink-muted">Tudo em dia. Nenhum saldo pendente.</p>
      ) : (
        <ul className="divide-y divide-line">
          {receivables.map((item) => (
            <li key={item.reservationId}>
              <Link
                href={`${routes.reservations}/${item.reservationId}`}
                className="flex items-center gap-3 py-3 text-ink"
              >
                <Avatar name={item.guestName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.guestName}</span>
                  <span
                    className={cn(
                      "text-xs",
                      item.dueStatus === "upcoming" ? "text-ink-muted" : "font-semibold text-accent-ink",
                    )}
                  >
                    {dueLabel(item)} · {item.chaletName}
                  </span>
                </span>
                <Money value={item.amount} className="text-[15px] font-bold" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ButtonLink href={routes.finance} variant="ghost" block className="mt-auto bg-canvas">
        Abrir financeiro
      </ButtonLink>
    </CardSection>
  );
}
