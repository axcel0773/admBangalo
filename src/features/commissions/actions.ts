"use server";

import { revalidatePath } from "next/cache";

import { attempt } from "@/lib/actions";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { assertIds, INVALID_ID_MESSAGE, isUuid } from "@/lib/ids";
import { MutationError } from "@/lib/supabase/errors";

import { commissionPaymentSchema, commissionSchema } from "./schemas";
import { commissionsRepository } from "./services";

/** A comissão aparece na reserva, nas despesas e no lucro do Financeiro. */
function refresh() {
  revalidatePath("/", "layout");
}

async function run(formData: FormData, task: () => Promise<void>, success: string): Promise<FormState> {
  try {
    await task();
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }
  refresh();
  return { status: "success", message: success };
}

/** Adiciona ou corrige corretor e valor. Use com `.bind(null, reservationId)`. */
export async function saveCommission(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(reservationId)) return errorFormState(INVALID_ID_MESSAGE, formData);
  const parsed = commissionSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);
  return run(formData, async () => (await commissionsRepository()).save(reservationId, parsed.data), "Comissão salva.");
}

/** Marca a comissão como paga (data e forma). Use com `.bind(null, reservationId)`. */
export async function payCommission(reservationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(reservationId)) return errorFormState(INVALID_ID_MESSAGE, formData);
  const parsed = commissionPaymentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);
  return run(formData, async () => (await commissionsRepository()).markPaid(reservationId, parsed.data), "Comissão paga.");
}

/** Volta a comissão para "a pagar". Use com `.bind(null, reservationId)`. */
export async function unpayCommission(reservationId: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(reservationId);
    await (await commissionsRepository()).markUnpaid(reservationId);
    refresh();
  });
}

/** Tira a comissão da reserva. Use com `.bind(null, reservationId)`. */
export async function removeCommission(reservationId: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(reservationId);
    await (await commissionsRepository()).remove(reservationId);
    refresh();
  });
}
