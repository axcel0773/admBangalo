import { CalendarCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatLongDate, isIsoDate } from "@/lib/dates";
import { formatCurrency, pluralize } from "@/lib/format";

interface ReviewCardProps {
  chaletName: string | null;
  checkIn: string;
  checkOut: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  nights: number;
  guestName: string;
  adults: number;
  childrenCount: number;
  total: number | null;
  /** Corretor, quando houver. */
  brokerName?: string | null;
}

function day(date: string): string {
  if (!isIsoDate(date)) return "—";
  const text = formatLongDate(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Último passo da nova reserva: tudo o que vai ser salvo, para conferir antes de tocar em "Criar reserva". */
export function ReviewCard(props: ReviewCardProps) {
  const people = [
    pluralize(props.adults, "adulto", "adultos"),
    props.childrenCount > 0 ? pluralize(props.childrenCount, "criança", "crianças") : null,
  ]
    .filter(Boolean)
    .join(" e ");

  const rows: [string, string][] = [
    ["Bangalô", props.chaletName ?? "—"],
    ["Entrada", `${day(props.checkIn)}${props.checkInTime ? `, a partir de ${props.checkInTime.slice(0, 5)}` : ""}`],
    ["Saída", `${day(props.checkOut)}${props.checkOutTime ? `, até ${props.checkOutTime.slice(0, 5)}` : ""}`],
    ["Noites", props.nights > 0 ? pluralize(props.nights, "noite", "noites") : "—"],
    ["Responsável", props.guestName.trim() || "—"],
    ["Pessoas", people],
  ];
  if (props.brokerName) rows.push(["Corretor", props.brokerName]);

  return (
    <Card className="flex flex-col gap-3 border-2 border-primary-soft p-4 md:p-6">
      <p className="flex items-center gap-2 font-display text-lg font-semibold">
        <CalendarCheck aria-hidden="true" className="size-5 text-primary-ink" />
        Confira antes de criar
      </p>
      <dl className="divide-y divide-line text-[15px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-2">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="min-w-0 text-right font-semibold break-words">{value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 pt-3">
          <dt className="font-display text-lg font-semibold">Total</dt>
          <dd className="font-display text-lg font-semibold">{props.total !== null ? formatCurrency(props.total) : "—"}</dd>
        </div>
      </dl>
      <p className="text-sm text-ink-muted">Se algo estiver errado, toque em “Voltar” e corrija.</p>
    </Card>
  );
}
