"use client";

import { Check } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow } from "@/components/ui/form-layout";
import { useCloseInlineEdit } from "@/components/ui/inline-edit";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatCurrency, formatMoneyInput } from "@/lib/format";
import { moneyProblem } from "@/lib/masks";

interface InstallmentEditFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: { description: string; amount: number; due_date: string };
  /** Quanto já foi pago nesta parcela (só informativo). */
  covered: number;
}

/** Edição de uma parcela, aberta pelo lápis. Fecha sozinha depois de salvar. */
export function InstallmentEditForm({ action, initial, covered }: InstallmentEditFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const close = useCloseInlineEdit();

  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success") close();
  }

  const error = (name: string) => fieldError(state, name);
  const v = (name: string, fallback?: string) => valueOf(state, name, fallback);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <p className="text-xs font-semibold text-ink-muted">Editar parcela</p>
      <FormAlert state={state} />
      <Field label="Descrição" name="description" defaultValue={v("description", initial.description)} required error={error("description")} />
      <FieldRow>
        <Field
          label="Valor (R$)"
          name="amount"
          inputMode="decimal"
          mask="money"
          validate={(value) => moneyProblem(value, { required: true, positive: true })}
          defaultValue={v("amount", formatMoneyInput(initial.amount))}
          required
          error={error("amount")}
        />
        <Field label="Vencimento" name="due_date" type="date" defaultValue={v("due_date", initial.due_date)} required error={error("due_date")} />
      </FieldRow>
      {covered > 0 ? <p className="-mt-1 text-xs text-ink-muted">Já pago nesta parcela: {formatCurrency(covered)}.</p> : null}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={close}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Salvando…">
          <Check aria-hidden="true" />
          Salvar
        </SubmitButton>
      </div>
    </form>
  );
}
