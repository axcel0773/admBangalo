"use client";

import { Link2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";
import { useCollapsibleForm } from "@/lib/hooks/use-collapsible-form";

export function IcalSourceForm({ action }: { action: (state: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction] = useActionState(action, idleFormState);
  const { open, openForm, closeForm } = useCollapsibleForm(state);

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        {state.status !== "idle" ? <FormAlert state={state} /> : null}
        <Button variant="ghost" block className="bg-canvas" onClick={openForm}>
          <Link2 aria-hidden="true" />
          Ligar calendário do Airbnb, Booking…
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl bg-canvas p-3" noValidate>
      <FormAlert state={state} />
      <Field label="Nome" name="label" placeholder="Airbnb" defaultValue={valueOf(state, "label")} required error={fieldError(state, "label")} />
      <Field
        label="Link do calendário (.ics)"
        name="url"
        type="url"
        inputMode="url"
        placeholder="https://www.airbnb.com.br/calendar/ical/…"
        hint="Airbnb: Calendário → Disponibilidade → Conectar calendários → Exportar. Booking: Tarifas e disponibilidade → Sincronizar calendários."
        defaultValue={valueOf(state, "url")}
        required
        error={fieldError(state, "url")}
      />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={closeForm}>
          Cancelar
        </Button>
        <SubmitButton className="flex-1" pendingLabel="Lendo calendário…">
          Ligar
        </SubmitButton>
      </div>
    </form>
  );
}
