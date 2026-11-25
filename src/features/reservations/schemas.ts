import { z } from "zod";

import { MAX_CHALET_GUESTS } from "@/features/chalets/domain";
import { newReservationCommissionFields, resolveNewReservationCommission } from "@/features/commissions/schemas";
import { daysBetween } from "@/lib/dates";
import { isUuid } from "@/lib/ids";
import { document, integer, isoDate, money, optionalText, phone } from "@/lib/validation";
import type { Json } from "@/types/database";

import { PRICING_MODES, resolveLodgingPricing, type LodgingPricing } from "./domain/lodging";

const companionSchema = z.object({
  full_name: z.string().trim().max(120),
  is_child: z.boolean().default(false),
});

/** Acompanhantes chegam como JSON num input oculto do formulário em etapas. */
const companionsField = z
  .string()
  .optional()
  .transform((raw, ctx) => {
    if (!raw) return [];
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "Lista de hóspedes inválida" });
      return z.NEVER;
    }
  })
  .pipe(z.array(companionSchema).max(30));

/** Dinheiro opcional: vazio vira undefined; preenchido segue as regras de `money`. */
const optionalMoney = (label: string) =>
  z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value : undefined))
    .pipe(money(label).optional());

/**
 * Campos de valor da hospedagem, iguais na nova reserva e no orçamento:
 * por diária (nightly_rate) ou pacote fechado (package_total + package_name).
 */
export const lodgingPricingFields = {
  pricing_mode: z.enum(PRICING_MODES).default("nightly"),
  nightly_rate: optionalMoney("Diária"),
  package_total: optionalMoney("Valor da hospedagem"),
  package_name: z.string().trim().max(60, "Nome do pacote tem no máximo 60 caracteres").optional(),
};

type LodgingPricingInput = {
  pricing_mode: (typeof PRICING_MODES)[number];
  nightly_rate?: number;
  package_total?: number;
};

/** Exige a diária ou o valor do pacote, conforme o modo escolhido. */
export function checkLodgingPricing(data: LodgingPricingInput, ctx: z.RefinementCtx): void {
  if (data.pricing_mode === "nightly" && data.nightly_rate === undefined) {
    ctx.addIssue({ code: "custom", path: ["nightly_rate"], message: "Diária é obrigatório" });
  }
  if (data.pricing_mode === "package" && !(data.package_total !== undefined && data.package_total > 0)) {
    ctx.addIssue({ code: "custom", path: ["package_total"], message: "Informe o valor do pacote" });
  }
}

/** Diária, nome e valor do pacote que vão para o banco (a diária do pacote é a média, só informativa). */
export function lodgingPricingOf(
  input: LodgingPricingInput & { package_name?: string; check_in: string; check_out: string },
): LodgingPricing {
  return resolveLodgingPricing({
    mode: input.pricing_mode,
    nights: Math.max(daysBetween(input.check_in, input.check_out), 1),
    nightlyRate: input.nightly_rate,
    packageName: input.package_name,
    packageTotal: input.package_total,
  });
}

export const newReservationSchema = z
  .object({
    chalet_id: z.string({ required_error: "Escolha o bangalô" }).uuid("Escolha o bangalô"),
    check_in: isoDate("Data de entrada"),
    check_out: isoDate("Data de saída"),
    adults: integer("Adultos", 1, MAX_CHALET_GUESTS),
    children: integer("Crianças", 0, MAX_CHALET_GUESTS - 1),
    source: z.enum(["direct", "whatsapp", "airbnb", "booking", "other"]).default("direct"),
    status: z.enum(["pending", "confirmed"]).default("confirmed"),
    guest_mode: z.enum(["existing", "new"]),
    main_guest_id: z.string().optional(),
    new_guest_name: z.string().trim().max(120).optional(),
    new_guest_phone: phone,
    new_guest_document: document,
    companions: companionsField,
    ...lodgingPricingFields,
    discount: z
      .string()
      .optional()
      .transform((value) => (value && value.trim() ? value : "0"))
      .pipe(money("Desconto")),
    notes: optionalText(1000),
    // Corretor (passo Hóspedes): só vale com o interruptor "Veio por corretor" ligado.
    ...newReservationCommissionFields,
    // Orçamento que originou a reserva (opcional); vazio ou inválido é ignorado.
    quote_id: z
      .string()
      .optional()
      .transform((value) => (value && isUuid(value) ? value : undefined)),
  })
  .superRefine((data, ctx) => {
    checkLodgingPricing(data, ctx);
    resolveNewReservationCommission(data, ctx);
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
    if (data.guest_mode === "existing" && !z.string().uuid().safeParse(data.main_guest_id).success) {
      ctx.addIssue({ code: "custom", path: ["main_guest_id"], message: "Escolha o hóspede responsável" });
    }
    if (data.guest_mode === "new" && !data.new_guest_name) {
      ctx.addIssue({ code: "custom", path: ["new_guest_name"], message: "Informe o nome do responsável" });
    }
  });

export type NewReservationInput = z.infer<typeof newReservationSchema>;

/** Formato aceito pela função create_reservation do banco. */
export function toCreateReservationPayload(input: NewReservationInput): Json {
  const commission = resolveNewReservationCommission(input);
  return {
    chalet_id: input.chalet_id,
    check_in: input.check_in,
    check_out: input.check_out,
    adults: input.adults,
    children: input.children,
    source: input.source,
    status: input.status,
    ...lodgingPricingOf(input),
    discount: input.discount,
    notes: input.notes,
    main_guest_id: input.guest_mode === "existing" ? (input.main_guest_id ?? null) : null,
    new_guest:
      input.guest_mode === "new"
        ? {
            full_name: input.new_guest_name ?? "",
            phone: input.new_guest_phone,
            document: input.new_guest_document,
          }
        : null,
    companions: input.companions
      .filter((companion) => companion.full_name)
      .map((companion) => ({ full_name: companion.full_name, is_child: companion.is_child })),
    commission: commission
      ? { broker_name: commission.broker_name, amount: commission.amount, paid_on: commission.paid_on, method: commission.method }
      : null,
  };
}

export const statusChangeSchema = z.enum(["pending", "confirmed", "checked_in", "checked_out", "cancelled"]);
