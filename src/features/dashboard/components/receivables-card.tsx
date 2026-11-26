import Link from "next/link";

import { routes } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { CardSection } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/dates";
import { pluralize } from "@/lib/format";

import type { Receivable } from "../domain/types";

function dueLabel({ dueStatus, dueDate }: Receivable): string {
  if (dueStatus === "today") return "vence hoje";
  if (dueStatus === "overdue") return `venceu ${formatShortDate(dueDate)}`;
  return `vence ${formatShortDate(dueDate)}`;
}

interface ReceivablesCardProps {
  /** Só o que vence em até 7 dias (ou já venceu). */
  receivables: Receivable[];
  /** Quantas reservas têm saldo no total, para o botão "Ver todos". */
  totalCount: number;
}

/**
 * "Cobrar esta semana": nome inteiro (sem cortar) e, embaixo, o valor e quando vence.
 * O resto do que há a receber fica na tela "A receber".
 */
export function ReceivablesCard({ receivables, totalCount }: ReceivablesCardProps) {
  return (
    <CardSection title="Cobrar esta semana" titleId="receivables-title" className="flex flex-col">
      {receivables.length === 0 ? (
        <p className="py-4 text-sm text-ink-muted">Nada para cobrar nos próximos 7 dias.</p>
      ) : (
        <ul className="divide-y divide-line">
          {receivables.map((item) => (
            <li key={item.reservationId}>
              <Link href={`${routes.reservations}/${item.reservationId}`} className="flex items-start gap-3 py-3 text-ink">
                <Avatar name={item.guestName} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold break-words">{item.guestName}</span>
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <Money value={item.amount} className="text-[15px] font-bold" />
                    <span
                      className={cn(
                        "text-sm",
                        item.dueStatus === "upcoming" ? "text-ink-muted" : "font-semibold text-accent-ink",
                      )}
                    >
                      {dueLabel(item)}
                    </span>
                  </span>
                  <span className="block text-sm text-ink-muted">{item.chaletName}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ButtonLink href={routes.receivables} variant="ghost" block className="mt-auto bg-canvas">
        {totalCount > 0 ? `Ver tudo a receber (${pluralize(totalCount, "reserva", "reservas")})` : "Ver tudo a receber"}
      </ButtonLink>
    </CardSection>
  );
}
