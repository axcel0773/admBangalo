"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

import { chaletSchema } from "./schemas";
import { chaletsRepository } from "./services";

async function save(id: string | null, formData: FormData): Promise<FormState> {
  const parsed = chaletSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  try {
    const repo = await chaletsRepository();
    if (id) await repo.update(id, parsed.data);
    else await repo.create(parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(routes.chalets);
}

export async function createChalet(_prev: FormState, formData: FormData): Promise<FormState> {
  return save(null, formData);
}

/** Use com `.bind(null, id)` na página de edição. */
export async function updateChalet(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  return save(id, formData);
}
