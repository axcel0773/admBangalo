"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow } from "@/components/ui/form-layout";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatMoneyInput } from "@/lib/format";

interface SeasonRateFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  baseRate: number;
}

/** Nova temporada: fechada por padrão; fecha sozinha depois de salvar. */
export function SeasonRateForm({ action, baseRate }: SeasonRateFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [open, setOpen] = useState(false);

  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success") setOpen(false);
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        {state.status === "success" ? <FormAlert state={state} /> : null}
        <Button variant="ghost" block className="bg-canvas" onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" />
          Adicionar temporada
        </Button>
      </div>
    );
  }

  const error = (name: string) => fieldError(state, name);
  const v = (name: string, fallback?: string) => valueOf(state, name, fallback);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <FormAlert state={state} />
      <Field label="Nome" name="label" placeholder="Réveillon, Julho, Feriado…" defaultValue={v("label")} required error={error("label")} />
      <FieldRow>
        <Field label="Primeira noite" name="first_night" type="date" defaultValue={v("first_night")} required error={error("first_night")} />
        <Field
          label="Última noite"
          name="last_night"
          type="date"
          defaultValue={v("last_night")}
          hint="A saída é no dia seguinte."
          required
          error={error("last_night")}
        />
      </FieldRow>
      <FieldRow>
        <Field
          label="Diária (R$)"
          name="nightly_rate"
          inputMode="decimal"
          defaultValue={v("nightly_rate", formatMoneyInput(baseRate))}
          required
          error={error("nightly_rate")}
        />
        <Field label="Mínimo de noites" name="min_nights" inputMode="numeric" defaultValue={v("min_nights", "1")} error={error("min_nights")} />
      </FieldRow>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1">Salvar temporada</SubmitButton>
      </div>
    </form>
  );
}
