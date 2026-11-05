"use server";

import { revalidatePath } from "next/cache";

import { routes } from "@/components/layout/navigation";
import { attempt } from "@/lib/actions";
import type { FormState } from "@/lib/forms";
import { assertIds } from "@/lib/ids";

import { cleaningRepository } from "./services";

/** Marca ou desmarca a limpeza da saída. Use com `.bind(null, reservationId, done)`. */
export async function setCleaningDone(reservationId: string, done: boolean): Promise<FormState> {
  return attempt(async () => {
    assertIds(reservationId);
    const repository = await cleaningRepository();
    if (done) await repository.markDone(reservationId);
    else await repository.markUndone(reservationId);
    revalidatePath(routes.cleaning);
    revalidatePath(routes.dashboard);
  });
}
