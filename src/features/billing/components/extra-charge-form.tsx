"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow } from "@/components/ui/form-layout";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";

const KIND_OPTIONS = [
  { value: "other", label: "Outra" },
  { value: "cleaning", label: "Limpeza" },
  { value: "extra_guest", label: "Pessoa extra" },
  { value: "pet", label: "Pet" },
];

interface ExtraChargeFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}

/** "Adicionar taxa avulsa": fechado por padrão para não poluir o celular. */
export function ExtraChargeForm({ action }: ExtraChargeFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [open, setOpen] = useState(false);

  // Fecha depois de salvar (ajuste durante a renderização, sem efeito).
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
          Adicionar taxa avulsa
        </Button>
      </div>
    );
  }

  const error = (name: string) => fieldError(state, name);
  const v = (name: string, fallback?: string) => valueOf(state, name, fallback);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <FormAlert state={state} />
      <Field label="Descrição" name="description" placeholder="Lenha, louça quebrada…" defaultValue={v("description")} required error={error("description")} />
      <FieldRow>
        <SelectField label="Tipo" name="kind" options={KIND_OPTIONS} defaultValue={v("kind", "other")} error={error("kind")} />
        <Field label="Quantidade" name="quantity" inputMode="numeric" defaultValue={v("quantity", "1")} error={error("quantity")} />
      </FieldRow>
      <Field label="Valor unitário (R$)" name="unit_amount" inputMode="decimal" placeholder="50,00" defaultValue={v("unit_amount")} required error={error("unit_amount")} />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Adicionando…">
          Adicionar
        </SubmitButton>
      </div>
    </form>
  );
}
