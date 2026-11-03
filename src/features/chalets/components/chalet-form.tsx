"use client";

import { useActionState, useState } from "react";

import { routes } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/button";
import { ColorSwatchField } from "@/components/ui/color-swatch-field";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow, FormActions, FormSection } from "@/components/ui/form-layout";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SubmitButton } from "@/components/ui/submit-button";
import { SwitchField } from "@/components/ui/switch-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { checkedOf, fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatMoneyInput } from "@/lib/format";

import { CHALET_COLORS, DEFAULT_CHALET_COLOR, shortTime, type Chalet } from "../domain";

interface ChaletFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  chalet?: Chalet;
}

export function ChaletForm({ action, chalet }: ChaletFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [maxGuests, setMaxGuests] = useState(chalet?.max_guests ?? 4);
  const [baseGuests, setBaseGuests] = useState(chalet?.base_guests ?? 2);
  const error = (name: string) => fieldError(state, name);
  const v = (name: string, saved?: string | number | null) => valueOf(state, name, saved);

  function changeMaxGuests(value: number) {
    setMaxGuests(value);
    if (baseGuests > value) setBaseGuests(value);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 md:gap-6" noValidate>
      <FormAlert state={state} />

      <FormSection title="Identificação">
        <Field label="Nome" name="name" defaultValue={v("name", chalet?.name)} placeholder="Chalé Ipê" required error={error("name")} />
        <TextareaField
          label="Descrição (opcional)"
          name="description"
          defaultValue={v("description", chalet?.description)}
          placeholder="Lareira, hidromassagem, vista para o vale…"
          error={error("description")}
        />
        <ColorSwatchField
          name="color"
          label="Cor no calendário"
          colors={CHALET_COLORS}
          defaultValue={v("color", chalet?.color ?? DEFAULT_CHALET_COLOR)}
          error={error("color")}
        />
      </FormSection>

      <FormSection title="Capacidade e diária" description="A diária inclui os hóspedes inclusos; acima disso vale a taxa de pessoa extra.">
        <div className="divide-y divide-line">
          <NumberStepper name="max_guests" label="Capacidade máxima" min={1} max={30} value={maxGuests} onChange={changeMaxGuests} />
          <NumberStepper
            name="base_guests"
            label="Hóspedes inclusos na diária"
            min={1}
            max={maxGuests}
            value={baseGuests}
            onChange={setBaseGuests}
          />
        </div>
        {error("base_guests") ? <p className="text-xs font-semibold text-danger-ink">{error("base_guests")}</p> : null}
        <Field
          label="Diária base (R$)"
          name="base_nightly_rate"
          inputMode="decimal"
          defaultValue={v("base_nightly_rate", formatMoneyInput(chalet?.base_nightly_rate))}
          placeholder="350,00"
          required
          error={error("base_nightly_rate")}
        />
      </FormSection>

      <FormSection title="Horários">
        <FieldRow>
          <Field
            label="Check-in a partir de"
            name="check_in_time"
            type="time"
            defaultValue={v("check_in_time", shortTime(chalet?.check_in_time ?? "14:00"))}
            error={error("check_in_time")}
          />
          <Field
            label="Check-out até"
            name="check_out_time"
            type="time"
            defaultValue={v("check_out_time", shortTime(chalet?.check_out_time ?? "12:00"))}
            error={error("check_out_time")}
          />
        </FieldRow>
      </FormSection>

      <SwitchField
        name="active"
        label="Disponível para reservas"
        description="Desligue para esconder o chalé do calendário e das novas reservas."
        defaultChecked={checkedOf(state, "active", chalet?.active ?? true)}
      />

      <FormActions>
        <ButtonLink href={routes.chalets} variant="secondary">
          Cancelar
        </ButtonLink>
        <SubmitButton>{chalet ? "Salvar alterações" : "Cadastrar chalé"}</SubmitButton>
      </FormActions>
    </form>
  );
}
