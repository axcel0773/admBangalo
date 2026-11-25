"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { attempt } from "@/lib/actions";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { INVALID_ID_MESSAGE, assertIds, isUuid } from "@/lib/ids";
import { MutationError } from "@/lib/supabase/errors";

import { packageSchema } from "./schemas";
import { packagesRepository } from "./services";

async function save(id: string | null, formData: FormData): Promise<FormState> {
  const parsed = packageSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  try {
    const repo = await packagesRepository();
    if (id) await repo.update(id, parsed.data);
    else await repo.create(parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  // Nova reserva e novo orçamento mostram os pacotes como atalhos.
  revalidatePath("/", "layout");
  redirect(routes.packages);
}

export async function createPackage(_prev: FormState, formData: FormData): Promise<FormState> {
  return save(null, formData);
}

/** Use com `.bind(null, id)` na página de edição. */
export async function updatePackage(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(id)) return errorFormState(INVALID_ID_MESSAGE, formData);
  return save(id, formData);
}

/** Exclui o pacote. Use com `.bind(null, id)`. Reservas e orçamentos já feitos não mudam. */
export async function deletePackage(id: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(id);
    await (await packagesRepository()).remove(id);
    revalidatePath("/", "layout");
  });
}
