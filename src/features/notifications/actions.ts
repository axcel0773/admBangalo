"use server";

import { revalidatePath } from "next/cache";

import { routes } from "@/components/layout/navigation";
import { attempt } from "@/lib/actions";
import { errorFormState, formDataToObject, invalidFormState, type FormState } from "@/lib/forms";
import { MutationError } from "@/lib/supabase/errors";

import { preferencesSchema, subscriptionSchema, type SubscriptionInput } from "./schemas";
import { notificationsRepository, sendTestNotification } from "./services";

/** O navegador chama depois de aceitar a permissão e criar a inscrição push. */
export async function saveSubscription(input: SubscriptionInput): Promise<FormState> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Inscrição inválida. Tente ativar de novo." };
  return attempt(async () => {
    await (await notificationsRepository()).saveSubscription(parsed.data);
    revalidatePath(routes.settings);
  }, "Notificações ativadas neste aparelho.");
}

export async function removeSubscription(endpoint: string): Promise<FormState> {
  if (!endpoint.startsWith("https://") || endpoint.length > 1000) return { status: "error", message: "Aparelho inválido." };
  return attempt(async () => {
    await (await notificationsRepository()).removeSubscription(endpoint);
    revalidatePath(routes.settings);
  }, "Notificações desativadas neste aparelho.");
}

export async function updateNotificationPreferences(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = preferencesSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalidFormState(parsed.error, formData);
  try {
    await (await notificationsRepository()).updatePreferences(parsed.data);
  } catch (error) {
    if (error instanceof MutationError) return errorFormState(error.message, formData);
    throw error;
  }
  revalidatePath(routes.settings);
  return { status: "success", message: "Preferências salvas." };
}

export async function sendTestNotificationAction(): Promise<FormState> {
  const sent = await sendTestNotification();
  return sent > 0
    ? { status: "success", message: "Teste enviado. Confira o aparelho." }
    : { status: "error", message: "Nenhum aparelho recebeu. Ative as notificações neste aparelho e tente de novo." };
}
