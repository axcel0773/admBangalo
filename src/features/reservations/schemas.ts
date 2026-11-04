import { z } from "zod";

import { MAX_CHALET_GUESTS } from "@/features/chalets/domain";
import { daysBetween } from "@/lib/dates";
import { document, integer, isoDate, money, optionalText, phone } from "@/lib/validation";
import type { Json } from "@/types/database";

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

export const newReservationSchema = z
  .object({
    chalet_id: z.string({ required_error: "Escolha o chalé" }).uuid("Escolha o chalé"),
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
    nightly_rate: money("Diária"),
    discount: z
      .string()
      .optional()
      .transform((value) => (value && value.trim() ? value : "0"))
      .pipe(money("Desconto")),
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
  return {
    chalet_id: input.chalet_id,
    check_in: input.check_in,
    check_out: input.check_out,
    adults: input.adults,
    children: input.children,
    source: input.source,
    status: input.status,
    nightly_rate: input.nightly_rate,
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
  };
}

export const statusChangeSchema = z.enum(["pending", "confirmed", "checked_in", "checked_out", "cancelled"]);
