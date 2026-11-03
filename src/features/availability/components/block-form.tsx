"use client";

import { CalendarOff } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow } from "@/components/ui/form-layout";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { useCollapsibleForm } from "@/lib/hooks/use-collapsible-form";

export function BlockForm({ action }: { action: (state: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction] = useActionState(action, idleFormState);
  const { open, openForm, closeForm } = useCollapsibleForm(state);

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        {state.status === "success" ? <FormAlert state={state} /> : null}
        <Button variant="ghost" block className="bg-canvas" onClick={openForm}>
          <CalendarOff aria-hidden="true" />
          Bloquear datas
        </Button>
      </div>
    );
  }

  const error = (name: string) => fieldError(state, name);
  const v = (name: string) => valueOf(state, name);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <FormAlert state={state} />
      <Field label="Motivo" name="reason" placeholder="Manutenção, uso próprio…" defaultValue={v("reason")} required error={error("reason")} />
      <FieldRow>
        <Field label="Primeira noite" name="first_night" type="date" defaultValue={v("first_night")} required error={error("first_night")} />
        <Field label="Última noite" name="last_night" type="date" defaultValue={v("last_night")} hint="Livre de novo no dia seguinte." required error={error("last_night")} />
      </FieldRow>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={closeForm}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1">Bloquear</SubmitButton>
      </div>
    </form>
  );
}
