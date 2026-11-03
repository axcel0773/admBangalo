"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { paths, routes } from "@/components/layout/navigation";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

import { guestSchema } from "./schemas";
import { guestsRepository } from "./services";

async function save(id: string | null, formData: FormData): Promise<FormState> {
  const parsed = guestSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  let guestId = id;
  try {
    const repo = await guestsRepository();
    if (id) await repo.update(id, parsed.data);
    else guestId = await repo.create(parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  revalidatePath(routes.guests, "layout");
  redirect(guestId ? paths.guest(guestId) : routes.guests);
}

export async function createGuest(_prev: FormState, formData: FormData): Promise<FormState> {
  return save(null, formData);
}

/** Use com `.bind(null, id)` na página de edição. */
export async function updateGuest(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  return save(id, formData);
}

/** LGPD: apaga os dados pessoais do hóspede. Use com `.bind(null, id)`. */
export async function anonymizeGuest(id: string): Promise<void> {
  await (await guestsRepository()).anonymize(id);
  revalidatePath("/", "layout");
  redirect(paths.guest(id));
}
