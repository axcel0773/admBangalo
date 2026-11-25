import { ChevronRight, CircleCheck, MessageCircle } from "lucide-react";

import { paths } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { whatsappUrl } from "@/features/guests";
import { formatShortDate } from "@/lib/dates";
import { pluralize } from "@/lib/format";

import { dueLabel, groupReceivables, type ReceivableFilter, type ReceivablesSummary, type ReceivableStatus } from "../domain/receivables";
import type { ReceivableEntry } from "../services/get-receivables";

const TONE: Record<ReceivableStatus, BadgeTone> = { overdue: "danger", today: "warning", upcoming: "neutral" };

/** Quadro do topo: total a receber e a divisão por situação. */
export function ReceivablesTotal({ summary }: { summary: ReceivablesSummary }) {
  const parts: { label: string; status: ReceivableStatus }[] = [
    { label: "Vencidas", status: "overdue" },
    { label: "Vencem hoje", status: "today" },
    { label: "Próximas", status: "upcoming" },
  ];
  return (
    <section aria-label="Total a receber" className="flex flex-col gap-3 rounded-card bg-primary-strong p-4 text-on-primary shadow-primary md:p-5">
      <div>
        <p className="text-xs text-on-primary/75">Total a receber</p>
        <p className="font-display text-[30px] leading-tight font-semibold">
          <Money value={summary.total} />
        </p>
        <p className="text-xs text-on-primary/75">{pluralize(summary.count, "reserva com saldo", "reservas com saldo")}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {parts.map((part) => (
          <div key={part.status} className="min-w-0 rounded-xl bg-white/12 px-2.5 py-2">
            <dt className="truncate text-[11px] text-on-primary/75">{part.label}</dt>
            <dd className={part.status === "overdue" && summary.byStatus.overdue.count > 0 ? "text-sm font-bold text-accent" : "text-sm font-bold"}>
              <Money value={summary.byStatus[part.status].total} rounded />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Lista agrupada (vencidas, hoje, próximas), cada item com Cobrar e Ver reserva. */
export function ReceivablesList({ items, filter }: { items: ReceivableEntry[]; filter: ReceivableFilter }) {
  const groups = groupReceivables(items, filter);
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<CircleCheck />}
        title={items.length === 0 ? "Tudo em dia" : "Nada neste filtro"}
        description={items.length === 0 ? "Nenhuma reserva com saldo em aberto." : "Escolha outro filtro para ver os demais saldos."}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.status} aria-labelledby={`receivables-${group.status}`} className="flex flex-col gap-2">
          <h2 id={`receivables-${group.status}`} className="flex items-center justify-between px-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            <span>{group.label}</span>
            <Money value={group.total} />
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card">
            {group.items.map((item) => {
              const href = whatsappUrl(item.phone, item.message);
              return (
                <li key={item.reservationId} className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.guestName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{item.guestName}</p>
                      <p className="line-clamp-2 text-xs text-ink-muted">
                        {item.chaletName} · {formatShortDate(item.checkIn)} a {formatShortDate(item.checkOut)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Money value={item.amount} className="font-display text-base font-semibold" />
                      <Badge tone={TONE[item.dueStatus]}>{dueLabel(item)}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {href ? (
                      <ButtonLink href={href} variant="soft" size="sm" target="_blank" rel="noopener noreferrer">
                        <MessageCircle aria-hidden="true" />
                        Cobrar
                      </ButtonLink>
                    ) : (
                      <p className="flex items-center justify-center rounded-control bg-muted px-2 text-center text-xs text-ink-muted">
                        Sem telefone
                      </p>
                    )}
                    <ButtonLink href={paths.reservation(item.reservationId)} variant="secondary" size="sm">
                      Ver reserva
                      <ChevronRight aria-hidden="true" />
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
