"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { paths, routes } from "@/components/layout/navigation";
import { attempt } from "@/lib/actions";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { assertIds } from "@/lib/ids";
import { MutationError } from "@/lib/supabase/errors";

import { canTransition, timestampsFor } from "./domain/status";
import { newReservationSchema, statusChangeSchema, toCreateReservationPayload } from "./schemas";
import { reservationsRepository } from "./services";

export async function createReservation(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newReservationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  let reservationId: string;
  try {
    reservationId = await (await reservationsRepository()).create(toCreateReservationPayload(parsed.data));
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  // Painel, calendário, listas e ficha do hóspede mudam com uma reserva nova.
  revalidatePath("/", "layout");
  redirect(paths.reservation(reservationId));
}

/** Exclui a reserva (só sem dinheiro registrado) e volta para a lista. Use com `.bind(null, id)`. */
export async function deleteReservation(id: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(id);
    await (await reservationsRepository()).remove(id);
    revalidatePath("/", "layout");
    redirect(routes.reservations);
  });
}

/** Botões de status da reserva. Use com `.bind(null, id, "checked_in")`. */
export async function changeReservationStatus(id: string, next: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(id);
    const parsed = statusChangeSchema.safeParse(next);
    if (!parsed.success) throw new MutationError("Status inválido.");
    const target = parsed.data;
    const repo = await reservationsRepository();

    const current = await repo.findStatus(id);
    if (!current || !canTransition(current, target)) {
      throw new MutationError("Esta mudança de status não é permitida agora.");
    }

    await repo.updateStatus(id, { status: target, ...timestampsFor(target) });
    revalidatePath("/", "layout");
  });
}
