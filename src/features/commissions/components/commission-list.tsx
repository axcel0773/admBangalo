import { paths } from "@/components/layout/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CardSection } from "@/components/ui/card";
import { ListRow } from "@/components/ui/list-row";
import { Money } from "@/components/ui/money";
import { PAYMENT_METHOD_LABELS } from "@/features/billing/domain/payments";
import { formatShortDate } from "@/lib/dates";

import type { CommissionRow } from "../data/commissions.repository";

interface CommissionListProps {
  title: string;
  titleId: string;
  rows: CommissionRow[];
  /** "paid": mostra quando foi paga; "pending": mostra a entrada do hóspede. */
  kind: "paid" | "pending";
  description?: string;
}

/** Comissões de corretor (pagas no mês ou a pagar), cada uma levando à reserva. */
export function CommissionList({ title, titleId, rows, kind, description }: CommissionListProps) {
  if (rows.length === 0) return null;
  return (
    <CardSection title={title} titleId={titleId}>
      {description ? <p className="-mt-1 mb-1 text-sm text-ink-muted">{description}</p> : null}
      <ul className="stagger divide-y divide-line">
        {rows.map((row) => {
          const broker = row.broker_name ?? "Corretor";
          const subtitle =
            kind === "paid" && row.commission_paid_on
              ? `Paga em ${formatShortDate(row.commission_paid_on)}${row.commission_method ? ` · ${PAYMENT_METHOD_LABELS[row.commission_method]}` : ""} · ${row.guest_name}`
              : `${row.guest_name} · entrada ${formatShortDate(row.check_in)}`;
          return (
            <ListRow
              key={row.id}
              href={paths.reservation(row.id)}
              leading={<Avatar name={broker} size="sm" />}
              title={broker}
              subtitle={subtitle}
              trailing={
                <span className="flex flex-col items-end gap-1">
                  <Money value={row.commission_amount ?? 0} className="text-sm font-semibold" />
                  {kind === "pending" && row.status === "cancelled" ? <Badge tone="danger">Cancelada</Badge> : null}
                </span>
              }
            />
          );
        })}
      </ul>
    </CardSection>
  );
}
