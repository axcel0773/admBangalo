"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { paths, routes } from "@/components/layout/navigation";
import { attempt } from "@/lib/actions";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { assertIds, INVALID_ID_MESSAGE, isUuid } from "@/lib/ids";
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
  if (!isUuid(id)) return errorFormState(INVALID_ID_MESSAGE, formData);
  return save(id, formData);
}

/** Exclui o hóspede e volta para a lista. Use com `.bind(null, id)`. */
export async function removeGuest(id: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(id);
    await (await guestsRepository()).remove(id);
    revalidatePath("/", "layout");
    redirect(routes.guests);
  });
}
