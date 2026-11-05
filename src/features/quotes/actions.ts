"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { paths, routes } from "@/components/layout/navigation";
import { getNewReservationContext, nightsOf, quoteDraft, validateDraft } from "@/features/reservations";
import { suggestedDeposit, normalizeDepositPercent } from "@/features/billing/domain/deposit";
import { getMyProfile } from "@/features/profile/services";
import { attempt } from "@/lib/actions";
import { todayIso } from "@/lib/dates";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { assertIds } from "@/lib/ids";
import { MutationError } from "@/lib/supabase/errors";

import { buildQuoteLines, validUntilFrom } from "./domain/quote-document";
import { newQuoteSchema } from "./schemas";
import { quotesRepository } from "./services";

export async function createQuote(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newQuoteSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);
  const input = parsed.data;

  // Os valores são recalculados aqui, com as taxas e a capacidade do banco: o navegador só sugere.
  const context = await getNewReservationContext();
  const chalet = context.chalets.find((candidate) => candidate.id === input.chalet_id);
  if (!chalet) return errorFormState("Bangalô não encontrado.", formData);

  const draft = {
    chalet,
    checkIn: input.check_in,
    checkOut: input.check_out,
    adults: input.adults,
    children: input.children,
    nightlyRate: input.nightly_rate,
    discount: input.discount,
  };
  const issues = validateDraft(draft);
  if (issues.capacity) return errorFormState(issues.capacity, formData);
  const quote = quoteDraft(draft, context.fees);
  if (!quote) return errorFormState("Confira as datas do orçamento.", formData);

  const profile = await getMyProfile();
  const depositPercent = normalizeDepositPercent(profile?.default_deposit_percent);

  let quoteId: string;
  try {
    quoteId = await (await quotesRepository()).create({
      chalet_id: chalet.id,
      guest_name: input.guest_name,
      guest_phone: input.guest_phone,
      check_in: input.check_in,
      check_out: input.check_out,
      adults: input.adults,
      children: input.children,
      nightly_rate: input.nightly_rate,
      discount: input.discount,
      lines: buildQuoteLines({
        nights: nightsOf(input.check_in, input.check_out),
        nightlyRate: input.nightly_rate,
        discount: input.discount,
        lodging: quote.lodging,
        charges: quote.charges,
      }),
      total: quote.total,
      deposit_amount: suggestedDeposit(quote.total, depositPercent),
      notes: input.notes,
      valid_until: validUntilFrom(todayIso(), input.validity_days),
    });
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }

  revalidatePath(routes.quotes);
  redirect(paths.quote(quoteId));
}

/** Exclui o orçamento e volta para a lista. Use com `.bind(null, id)`. */
export async function deleteQuote(id: string): Promise<FormState> {
  return attempt(async () => {
    assertIds(id);
    await (await quotesRepository()).remove(id);
    revalidatePath(routes.quotes);
    redirect(routes.quotes);
  });
}
