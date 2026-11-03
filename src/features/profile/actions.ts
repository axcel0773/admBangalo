"use server";

import { revalidatePath } from "next/cache";

import { requireOwner } from "@/features/auth/session";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

import { profileSchema } from "./schemas";
import { profileRepository } from "./services";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  const owner = await requireOwner();
  try {
    await (await profileRepository()).update(owner.id, parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  // O nome aparece na barra lateral e no Painel.
  revalidatePath("/", "layout");
  return { status: "success", message: "Perfil salvo." };
}
