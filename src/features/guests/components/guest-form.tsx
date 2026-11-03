"use client";

import { useActionState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FieldRow, FormActions, FormSection } from "@/components/ui/form-layout";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextareaField } from "@/components/ui/textarea-field";
import { fieldError, idleFormState, valueOf, type FormState } from "@/lib/forms";

import type { Guest } from "../domain";

interface GuestFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  guest?: Guest;
}

export function GuestForm({ action, cancelHref, guest }: GuestFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const error = (name: string) => fieldError(state, name);
  const v = (name: string, saved?: string | number | null) => valueOf(state, name, saved);

  return (
    <form action={formAction} className="flex flex-col gap-4 md:gap-6" noValidate>
      <FormAlert state={state} />

      <FormSection title="Dados pessoais">
        <Field label="Nome completo" name="full_name" defaultValue={v("full_name", guest?.full_name)} autoComplete="name" required error={error("full_name")} />
        <FieldRow>
          <Field
            label="CPF ou documento"
            name="document"
            defaultValue={v("document", guest?.document)}
            placeholder="000.000.000-00"
            error={error("document")}
          />
          <Field label="Nascimento" name="birth_date" type="date" defaultValue={v("birth_date", guest?.birth_date)} error={error("birth_date")} />
        </FieldRow>
      </FormSection>

      <FormSection title="Contato">
        <FieldRow>
          <Field
            label="Telefone / WhatsApp"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={v("phone", guest?.phone)}
            placeholder="(11) 98765-4321"
            error={error("phone")}
          />
          <Field
            label="E-mail"
            name="email"
            type="email"
            inputMode="email"
            defaultValue={v("email", guest?.email)}
            error={error("email")}
          />
        </FieldRow>
        <div className="grid grid-cols-[1fr_96px] gap-4">
          <Field label="Cidade" name="city" defaultValue={v("city", guest?.city)} error={error("city")} />
          <Field label="UF" name="state" defaultValue={v("state", guest?.state)} maxLength={2} placeholder="SP" error={error("state")} />
        </div>
      </FormSection>

      <FormSection title="Observações">
        <TextareaField
          label="Preferências e anotações"
          name="notes"
          defaultValue={v("notes", guest?.notes)}
          placeholder="Alergias, pedidos especiais, chalé preferido…"
          error={error("notes")}
        />
      </FormSection>

      <FormActions>
        <ButtonLink href={cancelHref} variant="secondary">
          Cancelar
        </ButtonLink>
        <SubmitButton>{guest ? "Salvar alterações" : "Cadastrar hóspede"}</SubmitButton>
      </FormActions>
    </form>
  );
}
