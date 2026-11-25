"use client";

import { Check } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow } from "@/components/ui/form-layout";
import { useCloseInlineEdit } from "@/components/ui/inline-edit";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextareaField } from "@/components/ui/textarea-field";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatMoneyInput } from "@/lib/format";
import { moneyProblem } from "@/lib/masks";

import { PAYMENT_KIND_LABELS, PAYMENT_METHOD_LABELS, type PaymentKind, type PaymentMethod } from "../domain/payments";

const toOptions = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

interface PaymentEditFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: { kind: PaymentKind; method: PaymentMethod; amount: number; paid_at: string; notes: string | null };
  today: string;
}

/** Correção de um lançamento, aberta pelo lápis. O comprovante continua o mesmo. */
export function PaymentEditForm({ action, initial, today }: PaymentEditFormProps) {
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
    <form action={formAction} className="mb-3 flex flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <p className="text-xs font-semibold text-ink-muted">Editar lançamento</p>
      <FormAlert state={state} />
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
        <Field label="Data" name="paid_at" type="date" defaultValue={v("paid_at", initial.paid_at)} max={today} required error={error("paid_at")} />
      </FieldRow>
      <FieldRow>
        <SelectField label="Forma" name="method" options={toOptions(PAYMENT_METHOD_LABELS)} defaultValue={v("method", initial.method)} error={error("method")} />
        <SelectField label="Tipo" name="kind" options={toOptions(PAYMENT_KIND_LABELS)} defaultValue={v("kind", initial.kind)} error={error("kind")} />
      </FieldRow>
      <TextareaField label="Observação" name="notes" rows={2} placeholder="Opcional" defaultValue={v("notes", initial.notes ?? "")} error={error("notes")} />
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
