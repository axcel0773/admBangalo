"use client";

import { Field } from "@/components/ui/field";
import { FieldRow, FormSection } from "@/components/ui/form-layout";
import { SwitchField } from "@/components/ui/switch-field";
import { TextareaField } from "@/components/ui/textarea-field";

interface PricingStepProps {
  rateText: string;
  rateHint?: string;
  onRateChange: (value: string) => void;
  discount: string;
  onDiscountChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  confirmed: boolean;
  onConfirmedChange: (value: boolean) => void;
  error: (name: string) => string | undefined;
}

/** Etapa 3 da nova reserva: diária, desconto, observações e confirmação. */
export function PricingStep({
  rateText,
  rateHint,
  onRateChange,
  discount,
  onDiscountChange,
  notes,
  onNotesChange,
  confirmed,
  onConfirmedChange,
  error,
}: PricingStepProps) {
  return (
    <FormSection title="Valores">
      <FieldRow>
        <Field
          label="Diária (R$)"
          name="nightly_rate"
          inputMode="decimal"
          mask="money"
          value={rateText}
          onChange={(event) => onRateChange(event.target.value)}
          hint={rateHint}
          error={error("nightly_rate")}
        />
        <Field
          label="Desconto total (R$)"
          name="discount"
          inputMode="decimal"
          mask="money"
          placeholder="0,00"
          value={discount}
          onChange={(event) => onDiscountChange(event.target.value)}
          error={error("discount")}
        />
      </FieldRow>
      <TextareaField
        label="Observações"
        name="notes"
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        placeholder="Horário de chegada, pedidos especiais…"
        error={error("notes")}
      />
      <SwitchField
        label="Reserva confirmada"
        description="Desligue se ainda aguarda o sinal ou a confirmação do hóspede."
        checked={confirmed}
        onChange={(event) => onConfirmedChange(event.target.checked)}
      />
    </FormSection>
  );
}
