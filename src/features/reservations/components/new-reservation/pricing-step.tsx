"use client";

import { Field } from "@/components/ui/field";
import { FormSection } from "@/components/ui/form-layout";
import { SwitchField } from "@/components/ui/switch-field";
import { TextareaField } from "@/components/ui/textarea-field";
import type { PackageOption } from "@/features/packages/domain";

import { LodgingPricingFields, type LodgingPricingState } from "./lodging-pricing";

interface PricingStepProps {
  pricing: LodgingPricingState;
  packages: PackageOption[];
  nights: number;
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

/** Etapa 3 da nova reserva: diária ou pacote, desconto, observações e confirmação. */
export function PricingStep({
  pricing,
  packages,
  nights,
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
      <LodgingPricingFields
        pricing={pricing}
        packages={packages}
        nights={nights}
        rateText={rateText}
        rateHint={rateHint}
        onRateChange={onRateChange}
        error={error}
        discountField={
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
        }
      />
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
