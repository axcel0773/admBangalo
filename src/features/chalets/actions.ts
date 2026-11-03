"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { paths, routes } from "@/components/layout/navigation";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

import { chaletSchema, seasonRateSchema } from "./schemas";
import { chaletsRepository, seasonRatesRepository } from "./services";

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

/** Nova temporada do chalé. Use com `.bind(null, chaletId)`. */
export async function createSeasonRate(chaletId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = seasonRateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  try {
    await (await seasonRatesRepository()).create(chaletId, parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  revalidatePath(paths.chalet(chaletId));
  revalidatePath(routes.newReservation);
  return { status: "success", message: "Temporada salva." };
}

/** Use com `.bind(null, chaletId, rateId)`. */
export async function deleteSeasonRate(chaletId: string, rateId: string): Promise<void> {
  await (await seasonRatesRepository()).remove(chaletId, rateId);
  revalidatePath(paths.chalet(chaletId));
  revalidatePath(routes.newReservation);
}
