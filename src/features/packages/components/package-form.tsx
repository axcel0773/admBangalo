"use client";

import { useActionState } from "react";

import { routes } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FormActions, FormSection } from "@/components/ui/form-layout";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatMoneyInput } from "@/lib/format";
import { moneyProblem } from "@/lib/masks";

import { MAX_PACKAGE_NIGHTS, type StayPackage } from "../domain";

interface PackageFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  pkg?: StayPackage;
}

export function PackageForm({ action, pkg }: PackageFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const error = (name: string) => fieldError(state, name);
  const v = (name: string, saved?: string | number | null) => valueOf(state, name, saved);
  const savedNights = Number(v("nights", pkg?.nights ?? 2)) || 2;

  return (
    <form action={formAction} className="flex flex-col gap-4 md:gap-6" noValidate>
      <FormAlert state={state} />

      <FormSection title="Pacote" description="Só o valor total. O hóspede não vê diária.">
        <Field label="Nome" name="name" defaultValue={v("name", pkg?.name)} placeholder="Fim de semana" required error={error("name")} />
        <NumberStepper
          name="nights"
          label="Noites"
          min={1}
          max={MAX_PACKAGE_NIGHTS}
          defaultValue={savedNights}
          className="rounded-control bg-subtle px-4"
        />
        {error("nights") ? <p className="text-xs font-semibold text-danger-ink">{error("nights")}</p> : null}
        <Field
          label="Valor total (R$)"
          name="total"
          inputMode="decimal"
          mask="money"
          validate={(value) => moneyProblem(value, { required: true, positive: true })}
          defaultValue={v("total", formatMoneyInput(pkg?.total))}
          placeholder="1.000,00"
          hint="Valor fechado da hospedagem. As taxas (limpeza, energia…) entram à parte."
          required
          error={error("total")}
        />
      </FormSection>

      <FormActions>
        <ButtonLink href={routes.packages} variant="secondary">
          Cancelar
        </ButtonLink>
        <SubmitButton>{pkg ? "Salvar alterações" : "Salvar pacote"}</SubmitButton>
      </FormActions>
    </form>
  );
}
