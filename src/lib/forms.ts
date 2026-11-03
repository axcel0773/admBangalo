import type { ZodError } from "zod";

/**
 * Estado padrão devolvido por toda Server Action de formulário.
 * Os formulários (useActionState) só precisam conhecer este formato.
 *
 * `values` guarda o que foi enviado: o React 19 reseta o formulário depois
 * de cada envio, e sem isso o usuário perderia o que digitou ao errar um campo.
 */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, string>;
    };

export const idleFormState: FormState = { status: "idle" };

/** Primeiro erro de cada campo, no formato que os componentes de campo esperam. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Valores de texto enviados (arquivos ficam de fora). */
export function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}

export function invalidFormState(error: ZodError, formData?: FormData): FormState {
  return {
    status: "error",
    message: "Confira os campos destacados.",
    fieldErrors: fieldErrorsFrom(error),
    values: formData ? submittedValues(formData) : undefined,
  };
}

export function errorFormState(message: string, formData?: FormData): FormState {
  return { status: "error", message, values: formData ? submittedValues(formData) : undefined };
}

/** FormData → objeto simples (checkbox ausente vira undefined, como o zod espera). */
export function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const result: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue; // campos internos do Next
    result[key] = value;
  }
  return result;
}

export function fieldError(state: FormState, name: string): string | undefined {
  return state.status === "error" ? state.fieldErrors?.[name] : undefined;
}

/** Valor inicial de um campo: o que foi enviado (se houve erro) ou o valor salvo. */
export function valueOf(state: FormState, name: string, fallback?: string | number | null): string {
  if (state.status === "error" && state.values) return state.values[name] ?? "";
  if (fallback === null || fallback === undefined) return "";
  return String(fallback);
}

/** Estado inicial de checkbox/switch seguindo a mesma regra de `valueOf`. */
export function checkedOf(state: FormState, name: string, fallback: boolean): boolean {
  if (state.status === "error" && state.values) return state.values[name] === "on";
  return fallback;
}
