"use server";

import { revalidatePath } from "next/cache";

import { requireOwner } from "@/features/auth/session";
import { attempt } from "@/lib/actions";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

import { isOwnAvatarPath } from "./domain/avatar";
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

/** Chamada depois que o navegador subiu a foto para o Storage: grava o caminho e apaga a foto antiga. */
export async function saveAvatar(path: string): Promise<FormState> {
  return attempt(async () => {
    const owner = await requireOwner();
    if (!isOwnAvatarPath(path, owner.id)) throw new MutationError("Foto inválida.");
    const repo = await profileRepository();
    const previous = await repo.setAvatarPath(owner.id, path);
    if (previous && previous !== path) await repo.removeAvatarFile(previous);
    revalidatePath("/", "layout");
  });
}

export async function removeAvatar(): Promise<FormState> {
  return attempt(async () => {
    const owner = await requireOwner();
    const repo = await profileRepository();
    const previous = await repo.setAvatarPath(owner.id, null);
    if (previous) await repo.removeAvatarFile(previous);
    revalidatePath("/", "layout");
  });
}
