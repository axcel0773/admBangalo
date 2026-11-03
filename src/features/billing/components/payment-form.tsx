"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow } from "@/components/ui/form-layout";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextareaField } from "@/components/ui/textarea-field";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { formatMoneyInput } from "@/lib/format";

import { PAYMENT_KIND_LABELS, PAYMENT_METHOD_LABELS, type PaymentKind } from "../domain/payments";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

interface PaymentFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  suggestedKind: PaymentKind;
  suggestedAmount: number;
  today: string;
}

/** Registrar pagamento ou estorno. Abre num toque e fecha sozinho depois de salvar. */
export function PaymentForm({ action, suggestedKind, suggestedAmount, today }: PaymentFormProps) {
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
        <Button block onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" />
          {suggestedKind === "refund" ? "Registrar estorno" : "Registrar pagamento"}
        </Button>
      </div>
    );
  }

  const error = (name: string) => fieldError(state, name);
  const v = (name: string, fallback?: string) => valueOf(state, name, fallback);

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <FormAlert state={state} />
      <FieldRow>
        <SelectField
          label="Tipo"
          name="kind"
          options={toOptions(PAYMENT_KIND_LABELS)}
          defaultValue={v("kind", suggestedKind)}
          error={error("kind")}
        />
        <SelectField
          label="Forma"
          name="method"
          options={toOptions(PAYMENT_METHOD_LABELS)}
          defaultValue={v("method", "pix")}
          error={error("method")}
        />
      </FieldRow>
      <FieldRow>
        <Field
          label="Valor (R$)"
          name="amount"
          inputMode="decimal"
          defaultValue={v("amount", suggestedAmount > 0 ? formatMoneyInput(suggestedAmount) : "")}
          required
          error={error("amount")}
        />
        <Field label="Data" name="paid_at" type="date" defaultValue={v("paid_at", today)} max={today} required error={error("paid_at")} />
      </FieldRow>
      <TextareaField label="Observação" name="notes" rows={2} placeholder="Opcional" defaultValue={v("notes")} error={error("notes")} />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Registrando…">
          Registrar
        </SubmitButton>
      </div>
    </form>
  );
}
