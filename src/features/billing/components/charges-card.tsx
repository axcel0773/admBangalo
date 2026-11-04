import { X, Zap } from "lucide-react";

import { ActionForm } from "@/components/ui/action-form";
import { CardSection } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { formatCurrency, formatDecimal, pluralize } from "@/lib/format";
import type { Tables } from "@/types/database";

import { addExtraCharge, removeCharge } from "../actions";
import { ExtraChargeForm } from "./extra-charge-form";

type Charge = Tables<"reservation_charges">;

interface ChargesCardProps {
  reservation: Pick<
    Tables<"reservations">,
    "id" | "status" | "nights" | "nightly_rate" | "discount" | "lodging_total"
  >;
  charges: Charge[];
  grandTotal: number;
}

function chargeDetail(charge: Charge): string {
  if (charge.mode !== "metered") return `${formatDecimal(charge.quantity)} × ${formatCurrency(charge.unit_amount)}`;
  if (charge.meter_start === null) return "leitura de entrada pendente";
  if (charge.meter_end === null) return `entrada ${formatDecimal(charge.meter_start)} kWh · saída pendente`;
  return `${formatDecimal(charge.quantity)} kWh × ${formatCurrency(charge.unit_amount)}`;
}

/** Hospedagem + taxas (automáticas, energia e avulsas), com remoção e inclusão. */
export function ChargesCard({ reservation, charges, grandTotal }: ChargesCardProps) {
  const editable = reservation.status !== "cancelled";

  return (
    <CardSection title="Hospedagem e taxas" titleId="reservation-charges">
      <dl className="divide-y divide-line text-sm">
        <div className="flex justify-between gap-4 py-3">
          <dt>
            <span className="font-semibold">Hospedagem</span>
            <span className="block text-xs text-ink-muted">
              {pluralize(reservation.nights, "noite", "noites")} × {formatCurrency(reservation.nightly_rate)}
              {reservation.discount > 0 ? ` − ${formatCurrency(reservation.discount)}` : ""}
            </span>
          </dt>
          <dd className="font-semibold">{formatCurrency(reservation.lodging_total)}</dd>
        </div>

        {charges.map((charge) => (
          <div key={charge.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <dt className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-semibold">
                {charge.kind === "energy" ? <Zap className="size-4 text-energy-ink" aria-hidden="true" /> : null}
                {charge.description}
              </span>
              <span className="block text-xs text-ink-muted">{chargeDetail(charge)}</span>
            </dt>
            <dd className="flex items-center gap-1 font-semibold">
              {formatCurrency(charge.total)}
              {editable && charge.mode !== "metered" ? (
                <ActionForm action={removeCharge.bind(null, reservation.id, charge.id)} className="contents">
                  <ConfirmSubmit
                    message={`Remover “${charge.description}” desta reserva?`}
                    confirmLabel="Remover"
                    pendingLabel="Removendo…"
                    triggerSize="icon"
                    triggerLabel={`Remover ${charge.description}`}
                    block={false}
                    className="size-11 text-ink-muted md:size-9"
                  >
                    <X aria-hidden="true" />
                  </ConfirmSubmit>
                </ActionForm>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-1 mb-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
        <span className="font-display text-lg font-semibold">Total</span>
        <span className="font-display text-2xl font-semibold">{formatCurrency(grandTotal)}</span>
      </div>

      {editable ? <ExtraChargeForm action={addExtraCharge.bind(null, reservation.id)} /> : null}
    </CardSection>
  );
}
