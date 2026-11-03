import { z } from "zod";

import { integer, isoDate, money, optionalText, requiredText } from "@/lib/validation";

import { parseReading } from "./domain/meter";

/** Leitura opcional do medidor: vazio = ainda não anotada. */
const reading = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((raw, ctx) => {
      if (!raw) return null;
      const value = parseReading(raw);
      if (value === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} inválida` });
        return z.NEVER;
      }
      return value;
    });

export const meterReadingSchema = z
  .object({
    meter_start: reading("Leitura de entrada"),
    meter_end: reading("Leitura de saída"),
  })
  .superRefine((input, ctx) => {
    if (input.meter_end !== null && input.meter_start === null) {
      ctx.addIssue({ code: "custom", path: ["meter_start"], message: "Anote a leitura de entrada primeiro" });
    }
    if (input.meter_start !== null && input.meter_end !== null && input.meter_end < input.meter_start) {
      ctx.addIssue({ code: "custom", path: ["meter_end"], message: "A leitura de saída é menor que a de entrada" });
    }
  });

export type MeterReadingInput = z.infer<typeof meterReadingSchema>;

/** Taxa avulsa lançada direto na reserva (energia tem formulário próprio). */
export const extraChargeSchema = z.object({
  description: requiredText("Descrição", 80),
  kind: z.enum(["cleaning", "extra_guest", "pet", "other"], { message: "Escolha o tipo" }),
  unit_amount: money("Valor").refine((value) => value > 0, "Informe um valor maior que zero"),
  quantity: integer("Quantidade", 1, 99),
});

export type ExtraChargeInput = z.infer<typeof extraChargeSchema>;

export const paymentSchema = z.object({
  kind: z.enum(["deposit", "installment", "balance", "refund"], { message: "Escolha o tipo" }),
  method: z.enum(["pix", "cash", "credit_card", "debit_card", "bank_transfer", "platform", "other"], {
    message: "Escolha a forma de pagamento",
  }),
  amount: money("Valor"),
  paid_at: isoDate("Data"),
  notes: optionalText(200),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
