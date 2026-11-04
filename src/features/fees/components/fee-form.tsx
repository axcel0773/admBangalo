"use client";

import { useActionState, useState } from "react";

import { routes } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow, FormActions, FormSection } from "@/components/ui/form-layout";
import { SelectField, type SelectOption } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { SwitchField } from "@/components/ui/switch-field";
import { checkedOf, fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatMoneyInput } from "@/lib/format";
import { moneyProblem } from "@/lib/masks";

import { CHARGE_MODE_LABELS, FEE_KIND_LABELS, toOptions, type ChargeMode, type Fee } from "../domain";

interface FeeFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  chaletOptions: SelectOption[];
  fee?: Fee;
}

const AMOUNT_LABEL: Record<ChargeMode, string> = {
  per_stay: "Valor por estadia (R$)",
  per_night: "Valor por noite (R$)",
  per_guest: "Valor por pessoa (R$)",
  per_guest_night: "Valor por pessoa, por noite (R$)",
  metered: "Tarifa por kWh (R$)",
};

export function FeeForm({ action, chaletOptions, fee }: FeeFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [mode, setMode] = useState<ChargeMode>(fee?.mode ?? "per_stay");
  const error = (name: string) => fieldError(state, name);
  const v = (name: string, saved?: string | number | null) => valueOf(state, name, saved);

  return (
    <form action={formAction} className="flex flex-col gap-4 md:gap-6" noValidate>
      <FormAlert state={state} />

      <FormSection title="Taxa">
        <Field label="Nome" name="name" defaultValue={v("name", fee?.name)} placeholder="Limpeza" required error={error("name")} />
        <FieldRow>
          <SelectField
            label="Tipo"
            name="kind"
            options={toOptions(FEE_KIND_LABELS)}
            defaultValue={v("kind", fee?.kind ?? "cleaning")}
            error={error("kind")}
          />
          <SelectField
            label="Como cobrar"
            name="mode"
            options={toOptions(CHARGE_MODE_LABELS)}
            value={mode}
            onChange={(event) => setMode(event.target.value as ChargeMode)}
            error={error("mode")}
          />
        </FieldRow>
        <Field
          label={AMOUNT_LABEL[mode]}
          name="amount"
          inputMode="decimal" mask="money"
          validate={(value) => moneyProblem(value, { required: true })}
          defaultValue={v("amount", formatMoneyInput(fee?.amount))}
          placeholder={mode === "metered" ? "1,00" : "150,00"}
          hint={
            mode === "metered"
              ? "O valor é calculado no check-out: (leitura final − inicial) × tarifa."
              : mode === "per_guest" || mode === "per_guest_night"
                ? "Para o tipo “Pessoa extra”, conta só quem passa dos hóspedes inclusos."
                : undefined
          }
          required
          error={error("amount")}
        />
        <SelectField
          label="Vale para"
          name="chalet_id"
          options={chaletOptions}
          placeholder="Todos os chalés"
          defaultValue={v("chalet_id", fee?.chalet_id)}
          error={error("chalet_id")}
        />
      </FormSection>

      <div className="flex flex-col gap-3">
        <SwitchField
          name="auto_apply"
          label="Aplicar automaticamente"
          description="Entra sozinha em toda nova reserva."
          defaultChecked={checkedOf(state, "auto_apply", fee?.auto_apply ?? true)}
        />
        <SwitchField name="active" label="Ativa" defaultChecked={checkedOf(state, "active", fee?.active ?? true)} />
      </div>

      <FormActions>
        <ButtonLink href={routes.fees} variant="secondary">
          Cancelar
        </ButtonLink>
        <SubmitButton>{fee ? "Salvar alterações" : "Cadastrar taxa"}</SubmitButton>
      </FormActions>
    </form>
  );
}
