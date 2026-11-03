import { z } from "zod";

import { document, email, optionalText, phone, requiredText } from "@/lib/validation";

export const guestSchema = z.object({
  full_name: requiredText("Nome", 120),
  document,
  phone,
  email,
  birth_date: z
    .string()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").nullable()),
  city: optionalText(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(z.string().length(2, "Use a sigla, ex.: SP").nullable()),
  notes: optionalText(1000),
});

export type GuestInput = z.infer<typeof guestSchema>;
