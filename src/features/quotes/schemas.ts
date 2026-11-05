import { z } from "zod";

import { MAX_CHALET_GUESTS } from "@/features/chalets/domain";
import { daysBetween } from "@/lib/dates";
import { integer, isoDate, money, optionalText, phone, requiredText } from "@/lib/validation";

import { VALIDITY_OPTIONS } from "./domain/quote-document";

export const newQuoteSchema = z
  .object({
    chalet_id: z.string({ required_error: "Escolha o bangalô" }).uuid("Escolha o bangalô"),
    check_in: isoDate("Data de entrada"),
    check_out: isoDate("Data de saída"),
    adults: integer("Adultos", 1, MAX_CHALET_GUESTS),
    children: integer("Crianças", 0, MAX_CHALET_GUESTS - 1),
    guest_name: requiredText("Nome do hóspede", 120),
    guest_phone: phone,
    nightly_rate: money("Diária"),
    discount: z
      .string()
      .optional()
      .transform((value) => (value && value.trim() ? value : "0"))
      .pipe(money("Desconto")),
    validity_days: z.coerce
      .number()
      .int()
      .refine((days) => (VALIDITY_OPTIONS as readonly number[]).includes(days), "Escolha a validade"),
    notes: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    if (data.adults + data.children > MAX_CHALET_GUESTS) {
      ctx.addIssue({
        code: "custom",
        path: ["children"],
        message: `Regra do condomínio: no máximo ${MAX_CHALET_GUESTS} pessoas por bangalô`,
      });
    }
    if (data.check_in && data.check_out && daysBetween(data.check_in, data.check_out) < 1) {
      ctx.addIssue({ code: "custom", path: ["check_out"], message: "A saída precisa ser depois da entrada" });
    }
  });

export type NewQuoteInput = z.infer<typeof newQuoteSchema>;
