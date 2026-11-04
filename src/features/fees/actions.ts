"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { INVALID_ID_MESSAGE, isUuid } from "@/lib/ids";
import { MutationError } from "@/lib/supabase/errors";

import { feeSchema } from "./schemas";
import { feesRepository } from "./services";

async function save(id: string | null, formData: FormData): Promise<FormState> {
  const parsed = feeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  try {
    const repo = await feesRepository();
    if (id) await repo.update(id, parsed.data);
    else await repo.create(parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  revalidatePath(routes.fees);
  redirect(routes.fees);
}

export async function createFee(_prev: FormState, formData: FormData): Promise<FormState> {
  return save(null, formData);
}

/** Use com `.bind(null, id)` na página de edição. */
export async function updateFee(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(id)) return errorFormState(INVALID_ID_MESSAGE, formData);
  return save(id, formData);
}
