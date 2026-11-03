"use client";

import { useActionState } from "react";

import { routes } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FormActions, FormSection } from "@/components/ui/form-layout";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf } from "@/lib/forms";
import type { Tables } from "@/types/database";

import { updateProfile } from "../actions";

export function ProfileForm({ profile }: { profile: Tables<"profiles"> | null }) {
  const [state, formAction] = useActionState(updateProfile, idleFormState);
  const error = (name: string) => fieldError(state, name);
  const v = (name: string, saved?: string | number | null) => valueOf(state, name, saved);

  return (
    <form action={formAction} className="flex flex-col gap-4 md:gap-6" noValidate>
      <FormAlert state={state} />

      <FormSection title="Seus dados">
        <Field label="Seu nome" name="full_name" defaultValue={v("full_name", profile?.full_name)} autoComplete="name" required error={error("full_name")} />
        <Field
          label="Nome do negócio"
          name="business_name"
          defaultValue={v("business_name", profile?.business_name)}
          placeholder="Chalés da Serra"
          hint="Aparece no topo do menu."
          error={error("business_name")}
        />
        <Field
          label="Telefone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={v("phone", profile?.phone)}
          placeholder="(11) 98765-4321"
          error={error("phone")}
        />
      </FormSection>

      <FormSection title="Recebimentos" description="Usada no botão “Copiar Pix” das reservas.">
        <Field
          label="Chave Pix"
          name="pix_key"
          defaultValue={v("pix_key", profile?.pix_key)}
          placeholder="e-mail, telefone, CPF/CNPJ ou chave aleatória"
          error={error("pix_key")}
        />
      </FormSection>

      <FormActions>
        <ButtonLink href={routes.settings} variant="secondary">
          Voltar
        </ButtonLink>
        <SubmitButton>Salvar perfil</SubmitButton>
      </FormActions>
    </form>
  );
}
