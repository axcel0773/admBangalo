"use client";

import { useActionState } from "react";

import { routes } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FormActions, FormSection } from "@/components/ui/form-layout";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, idleFormState, valueOf } from "@/lib/forms";
import { phoneProblem } from "@/lib/masks";
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
        <Field label="Seu nome" name="full_name" defaultValue={v("full_name", profile?.full_name)} autoComplete="name" maxLength={80} required error={error("full_name")} />
        <Field
          label="Nome do negócio"
          name="business_name"
          defaultValue={v("business_name", profile?.business_name)}
          placeholder="Bangalôs da Serra"
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
          mask="phone"
          validate={phoneProblem}
          error={error("phone")}
        />
      </FormSection>

      <FormSection
        title="Recebimentos"
        description="Usados no “Pix copia e cola” das reservas: o hóspede cola no banco e o valor do saldo já vem preenchido."
      >
        <Field
          label="Chave Pix"
          name="pix_key"
          defaultValue={v("pix_key", profile?.pix_key)}
          maxLength={120}
          autoCapitalize="none"
          placeholder="e-mail, telefone, CPF/CNPJ ou chave aleatória"
          error={error("pix_key")}
        />
        <Field
          label="Cidade do recebedor"
          name="pix_city"
          defaultValue={v("pix_city", profile?.pix_city)}
          placeholder="Gonçalves"
          hint="Aparece para o hóspede no app do banco. O nome do recebedor é o nome do negócio."
          error={error("pix_city")}
        />
        <Field
          label="Sinal padrão (%)"
          name="default_deposit_percent"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          defaultValue={v("default_deposit_percent", profile?.default_deposit_percent ?? 30)}
          hint="Percentual do total sugerido nos orçamentos para garantir a reserva. Use 0 para não sugerir sinal."
          error={error("default_deposit_percent")}
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
