"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/components/layout/navigation";
import { attempt } from "@/lib/actions";
import { startOfMonth } from "@/lib/dates";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { assertIds } from "@/lib/ids";
import { MutationError } from "@/lib/supabase/errors";

import { expenseSchema } from "./schemas";
import { expensesRepository } from "./services";

export async function createExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = expenseSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);

  try {
    await (await expensesRepository()).create(parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  revalidatePath(routes.finance, "layout");
  // Volta para o mês da despesa lançada.
  redirect(`${routes.expenses}?mes=${startOfMonth(parsed.data.spent_on).slice(0, 7)}`);
}

/** Exclui a despesa. Use com `.bind(null, id)`. */
export async function deleteExpense(id: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(id);
    await (await expensesRepository()).remove(id);
    revalidatePath(routes.finance, "layout");
  });
}
