import { z } from "zod";

import { isoDate, money } from "@/lib/validation";

export const COMMISSION_METHODS = ["pix", "cash", "credit_card", "debit_card", "bank_transfer", "platform", "other"] as const;

const brokerName = z
  .string({ required_error: "Informe o nome do corretor" })
  .trim()
  .min(1, "Informe o nome do corretor")
  .max(80, "Nome do corretor tem no máximo 80 caracteres");

const amount = money("Comissão").refine((value) => value > 0, "A comissão precisa ser maior que zero");

const method = z.enum(COMMISSION_METHODS, { message: "Escolha a forma de pagamento" });

/** Corretor e valor (adicionar ou corrigir pela tela da reserva). */
export const commissionSchema = z.object({ broker_name: brokerName, amount });

export type CommissionInput = z.infer<typeof commissionSchema>;

/** Marcar a comissão como paga. */
export const commissionPaymentSchema = z.object({ paid_on: isoDate("Data"), method });

export type CommissionPaymentInput = z.infer<typeof commissionPaymentSchema>;

/**
 * Campos do passo Hóspedes da nova reserva. Interruptor desligado = sem comissão
 * (os demais campos são ignorados, mesmo que tenham sobrado preenchidos).
 */
export const newReservationCommissionFields = {
  has_commission: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((value) => value === "on" || value === "true"),
  broker_name: z.string().trim().max(80, "Nome do corretor tem no máximo 80 caracteres").optional(),
  commission_amount: z.string().optional(),
  commission_status: z.enum(["pending", "paid"]).default("pending"),
  commission_paid_on: z.string().optional(),
  commission_method: z.string().optional(),
};

export interface NewReservationCommissionInput {
  has_commission: boolean;
  broker_name?: string;
  commission_amount?: string;
  commission_status: "pending" | "paid";
  commission_paid_on?: string;
  commission_method?: string;
}

export interface CommissionPayload {
  broker_name: string;
  amount: number;
  paid_on: string | null;
  method: (typeof COMMISSION_METHODS)[number] | null;
}

/**
 * Valida a comissão da nova reserva (com `ctx`, dentro do superRefine) e devolve o que vai
 * para create_reservation, ou null quando não há comissão.
 */
export function resolveNewReservationCommission(
  input: NewReservationCommissionInput,
  ctx?: z.RefinementCtx,
): CommissionPayload | null {
  if (!input.has_commission) return null;

  const name = brokerName.safeParse(input.broker_name ?? "");
  if (!name.success) ctx?.addIssue({ code: "custom", path: ["broker_name"], message: name.error.issues[0]?.message ?? "Informe o nome do corretor" });

  const value = amount.safeParse(input.commission_amount ?? "");
  if (!value.success) {
    ctx?.addIssue({ code: "custom", path: ["commission_amount"], message: value.error.issues[0]?.message ?? "Informe o valor da comissão" });
  }

  let paidOn: string | null = null;
  let paidMethod: CommissionPayload["method"] = null;
  if (input.commission_status === "paid") {
    const date = isoDate("Data do pagamento").safeParse(input.commission_paid_on ?? "");
    if (date.success) paidOn = date.data;
    else ctx?.addIssue({ code: "custom", path: ["commission_paid_on"], message: "Informe a data do pagamento" });
    const chosen = method.safeParse(input.commission_method);
    if (chosen.success) paidMethod = chosen.data;
    else ctx?.addIssue({ code: "custom", path: ["commission_method"], message: "Escolha a forma de pagamento" });
  }

  if (!name.success || !value.success) return null;
  return { broker_name: name.data, amount: value.data, paid_on: paidOn, method: paidMethod };
}
