"use client";

import { useActionState } from "react";

import { routes } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow, FormActions, FormSection } from "@/components/ui/form-layout";
import { SelectField, type SelectOption } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { moneyProblem } from "@/lib/masks";

import { EXPENSE_CATEGORY_OPTIONS } from "../domain";

interface ExpenseFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  chaletOptions: SelectOption[];
  /** Data sugerida (hoje). */
  today: string;
}

export function ExpenseForm({ action, chaletOptions, today }: ExpenseFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const error = (name: string) => fieldError(state, name);
  const v = (name: string, saved?: string | number | null) => valueOf(state, name, saved);

  return (
    <form action={formAction} className="flex flex-col gap-4 md:gap-6" noValidate>
      <FormAlert state={state} />

      <FormSection title="Despesa">
        <FieldRow>
          <SelectField
            label="Categoria"
            name="category"
            options={EXPENSE_CATEGORY_OPTIONS}
            defaultValue={v("category", "maintenance")}
            error={error("category")}
          />
          <Field
            label="Valor (R$)"
            name="amount"
            inputMode="decimal"
            mask="money"
            validate={(value) => moneyProblem(value, { required: true })}
            defaultValue={v("amount")}
            placeholder="150,00"
            required
            error={error("amount")}
          />
        </FieldRow>
        <FieldRow>
          <Field label="Data" name="spent_on" type="date" defaultValue={v("spent_on", today)} required error={error("spent_on")} />
          <SelectField
            label="Bangalô"
            name="chalet_id"
            options={chaletOptions}
            placeholder="Geral (todos)"
            defaultValue={v("chalet_id")}
            error={error("chalet_id")}
          />
        </FieldRow>
        <Field
          label="Descrição (opcional)"
          name="description"
          defaultValue={v("description")}
          placeholder="Conta de luz de outubro"
          maxLength={120}
          error={error("description")}
        />
      </FormSection>

      <FormActions>
        <ButtonLink href={routes.expenses} variant="secondary">
          Cancelar
        </ButtonLink>
        <SubmitButton>Lançar despesa</SubmitButton>
      </FormActions>
    </form>
  );
}
