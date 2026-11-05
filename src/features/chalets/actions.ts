"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { paths, routes } from "@/components/layout/navigation";
import { requireOwner } from "@/features/auth/session";
import { attempt } from "@/lib/actions";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { assertIds, INVALID_ID_MESSAGE, isUuid } from "@/lib/ids";
import { MutationError } from "@/lib/supabase/errors";

import { isOwnChaletPhotoPath } from "./photo";
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
  if (!isUuid(id)) return errorFormState(INVALID_ID_MESSAGE, formData);
  return save(id, formData);
}

/** Nova temporada do bangalô. Use com `.bind(null, chaletId)`. */
export async function createSeasonRate(chaletId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(chaletId)) return errorFormState(INVALID_ID_MESSAGE, formData);
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
export async function deleteSeasonRate(chaletId: string, rateId: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(chaletId, rateId);
    await (await seasonRatesRepository()).remove(chaletId, rateId);
    revalidatePath(paths.chalet(chaletId));
    revalidatePath(routes.newReservation);
  });
}

/** Chamada depois que o navegador subiu a foto: grava o caminho e apaga a foto antiga. */
export async function saveChaletPhoto(chaletId: string, path: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(chaletId);
    const owner = await requireOwner();
    if (!isOwnChaletPhotoPath(path, owner.id, chaletId)) throw new MutationError("Foto inválida.");
    const repo = await chaletsRepository();
    const previous = await repo.setPhotoPath(chaletId, path);
    if (previous && previous !== path) await repo.removePhotoFile(previous);
    revalidatePath("/", "layout");
  });
}

export async function removeChaletPhoto(chaletId: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(chaletId);
    const repo = await chaletsRepository();
    const previous = await repo.setPhotoPath(chaletId, null);
    if (previous) await repo.removePhotoFile(previous);
    revalidatePath("/", "layout");
  });
}
