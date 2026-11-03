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

interface InstallmentFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** Valor ainda sem parcela (sugestão). */
  suggestedAmount: number;
  suggestedDate: string;
}

/** Nova parcela prevista. Fecha sozinha depois de salvar. */
export function InstallmentForm({ action, suggestedAmount, suggestedDate }: InstallmentFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [open, setOpen] = useState(false);

  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success") setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="ghost" block className="bg-canvas" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Adicionar parcela
      </Button>
    );
  }

  const error = (name: string) => fieldError(state, name);
  const v = (name: string, fallback?: string) => valueOf(state, name, fallback);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <FormAlert state={state} />
      <Field label="Descrição" name="description" placeholder="Parcela 2" defaultValue={v("description")} required error={error("description")} />
      <FieldRow>
        <Field
          label="Valor (R$)"
          name="amount"
          inputMode="decimal"
          defaultValue={v("amount", suggestedAmount > 0 ? formatMoneyInput(suggestedAmount) : "")}
          required
          error={error("amount")}
        />
        <Field label="Vencimento" name="due_date" type="date" defaultValue={v("due_date", suggestedDate)} required error={error("due_date")} />
      </FieldRow>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1">Adicionar</SubmitButton>
      </div>
    </form>
  );
}
