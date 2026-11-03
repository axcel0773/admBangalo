import { z } from "zod";

import { parseMoney } from "./money";

/**
 * Peças de schema reutilizadas pelos formulários.
 * Tudo chega do FormData como string; aqui convertemos e validamos.
 */

/** Texto obrigatório, sem espaços nas pontas. */
export const requiredText = (label: string, max = 120) =>
  z
    .string({ required_error: `${label} é obrigatório` })
    .trim()
    .min(1, `${label} é obrigatório`)
    .max(max, `${label} tem no máximo ${max} caracteres`);

/** Texto opcional: string vazia vira null (coluna nula no banco). */
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `No máximo ${max} caracteres`)
    .optional()
    .transform((value) => (value ? value : null));

/** Aceita "1.234,56", "1234.56" ou "350". */
export const money = (label: string) =>
  z
    .string({ required_error: `${label} é obrigatório` })
    .trim()
    .min(1, `${label} é obrigatório`)
    .transform((raw) => parseMoney(raw) ?? Number.NaN)
    .pipe(
      z
        .number({ invalid_type_error: `${label} inválido` })
        .finite(`${label} inválido`)
        .min(0, `${label} não pode ser negativo`),
    );

export const integer = (label: string, min: number, max: number) =>
  z.coerce
    .number({ invalid_type_error: `${label} inválido` })
    .int(`${label} deve ser um número inteiro`)
    .min(min, `${label}: mínimo ${min}`)
    .max(max, `${label}: máximo ${max}`);

/** Checkbox/switch: presente = true. */
export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
  .transform((value) => value === "on" || value === "true");

export const isoDate = (label: string) =>
  z
    .string({ required_error: `${label} é obrigatória` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} inválida`);

export const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido");

export const uuid = z.string().uuid("Registro inválido");

/** Telefone BR: guarda como digitado, mas exige 10–11 dígitos. */
export const phone = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^\d{10,11}$/.test(value.replace(/\D/g, "")), "Telefone com DDD, ex.: (11) 98765-4321")
  .transform((value) => (value ? value : null));

/** CPF opcional com dígitos verificadores; outros documentos (RG, passaporte) passam se não tiverem 11 dígitos. */
export const document = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || value.replace(/\D/g, "").length !== 11 || isValidCpf(value), "CPF inválido")
  .transform((value) => (value ? value : null));

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, "E-mail inválido")
  .transform((value) => (value ? value : null));
