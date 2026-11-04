"use client";

import { Zap } from "lucide-react";
import { useActionState, useState } from "react";

import { routes } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CardSection } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow } from "@/components/ui/form-layout";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatCurrency, formatDecimal } from "@/lib/format";

import { estimateEnergy, parseReading, pendingReading } from "../domain/meter";

interface EnergyCardProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  status: string;
  reading: { start: number | null; end: number | null };
  /** Tarifa por kWh (da cobrança já lançada ou da taxa cadastrada); null = sem taxa de energia. */
  tariff: number | null;
}

const toInput = (value: number | null) => (value === null ? "" : formatDecimal(value).replace(/\./g, ""));

const HINTS = {
  start: "Anote a leitura do medidor na entrada do hóspede.",
  end: "Anote a leitura na saída: o consumo entra no total da reserva.",
} as const;

/** Leitura do medidor na entrada e na saída; consumo × tarifa vira a cobrança de energia. */
export function EnergyCard({ action, status, reading, tariff }: EnergyCardProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [start, setStart] = useState(() => valueOf(state, "meter_start", toInput(reading.start)));
  const [end, setEnd] = useState(() => valueOf(state, "meter_end", toInput(reading.end)));

  const pending = pendingReading(status, reading);
  const estimate = estimateEnergy(parseReading(start), parseReading(end), tariff ?? 0);

  return (
    <CardSection
      title="Energia"
      titleId="reservation-energy"
      action={pending ? <Badge tone="energy">{pending === "start" ? "Falta a entrada" : "Falta a saída"}</Badge> : null}
    >
      {tariff === null ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            Para cobrar a energia pelo medidor, cadastre a taxa de energia com o modo “Leitura do medidor” e a tarifa
            por kWh.
          </p>
          <ButtonLink href={routes.newFee} variant="soft">
            Cadastrar taxa de energia
          </ButtonLink>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-3" noValidate>
          {pending ? <p className="text-sm text-ink-soft">{HINTS[pending]}</p> : null}

          <FieldRow>
            <Field
              label="Entrada (kWh)"
              name="meter_start"
              inputMode="decimal" mask="decimal"
              placeholder="12345,6"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              error={fieldError(state, "meter_start")}
            />
            <Field
              label="Saída (kWh)"
              name="meter_end"
              inputMode="decimal" mask="decimal"
              placeholder="12430,1"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              error={fieldError(state, "meter_end")}
            />
          </FieldRow>

          <div className="flex items-center gap-3 rounded-2xl bg-energy-soft px-4 py-3 text-energy-ink">
            <Zap className="size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm" aria-live="polite">
              {estimate.complete ? (
                <>
                  <strong>{formatDecimal(estimate.consumption)} kWh</strong> × {formatCurrency(tariff)} ={" "}
                  <strong>{formatCurrency(estimate.total)}</strong>
                </>
              ) : (
                <>Tarifa de {formatCurrency(tariff)} por kWh. O valor aparece com as duas leituras.</>
              )}
            </p>
          </div>

          <FormAlert state={state} />
          <SubmitButton variant="secondary" pendingLabel="Salvando leitura…">
            Salvar leitura
          </SubmitButton>
        </form>
      )}
    </CardSection>
  );
}
