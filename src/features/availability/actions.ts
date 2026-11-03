"use server";

import { revalidatePath } from "next/cache";

import { paths, routes } from "@/components/layout/navigation";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

import { blockSchema, icalSourceSchema } from "./schemas";
import { availabilityRepository, syncChaletSources, syncSource } from "./services";

function refresh(chaletId: string) {
  revalidatePath(paths.chalet(chaletId));
  revalidatePath(routes.calendar);
  revalidatePath(routes.newReservation);
}

/** Bloqueio manual (manutenção, uso próprio). Use com `.bind(null, chaletId)`. */
export async function createBlock(chaletId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = blockSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);
  try {
    await (await availabilityRepository()).createBlock(chaletId, parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }
  refresh(chaletId);
  return { status: "success", message: "Datas bloqueadas." };
}

/** Use com `.bind(null, chaletId, blockId)`. */
export async function deleteBlock(chaletId: string, blockId: string): Promise<void> {
  await (await availabilityRepository()).deleteManualBlock(chaletId, blockId);
  refresh(chaletId);
}

/** Link .ics do Airbnb/Booking. Já sincroniza ao salvar. Use com `.bind(null, chaletId)`. */
export async function addIcalSource(chaletId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = icalSourceSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  let result: Awaited<ReturnType<typeof syncSource>>;
  try {
    const source = await (await availabilityRepository()).createSource(chaletId, parsed.data);
    result = await syncSource(source);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }
  refresh(chaletId);
  return result.ok
    ? { status: "success", message: `Calendário ligado: ${result.events} período(s) ocupado(s) importado(s).` }
    : // O link fica salvo (o erro aparece na lista); não deixa o formulário aberto para não duplicar.
      { status: "success", message: `Link salvo, mas a primeira leitura falhou: ${result.error}` };
}

/** Use com `.bind(null, chaletId, sourceId)`. */
export async function removeIcalSource(chaletId: string, sourceId: string): Promise<void> {
  await (await availabilityRepository()).deleteSource(chaletId, sourceId);
  refresh(chaletId);
}

/** Botão "Sincronizar agora". Use com `.bind(null, chaletId)`. */
export async function syncChaletCalendars(chaletId: string): Promise<void> {
  await syncChaletSources(chaletId);
  refresh(chaletId);
}

/** Invalida o link antigo (se vazou ou mudou de plataforma). Use com `.bind(null, chaletId)`. */
export async function regenerateIcalLink(chaletId: string): Promise<void> {
  await (await availabilityRepository()).regenerateToken(chaletId);
  refresh(chaletId);
}
