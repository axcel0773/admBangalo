import { z } from "zod";

import { checkbox, money, requiredText } from "@/lib/validation";

export const feeSchema = z.object({
  name: requiredText("Nome", 60),
  kind: z.enum(["energy", "cleaning", "extra_guest", "pet", "other"], {
    errorMap: () => ({ message: "Escolha o tipo da taxa" }),
  }),
  mode: z.enum(["per_stay", "per_night", "per_guest", "per_guest_night", "metered"], {
    errorMap: () => ({ message: "Escolha como a taxa é cobrada" }),
  }),
  amount: money("Valor"),
  // "" = vale para todos os chalés
  chalet_id: z
    .string()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(z.string().uuid("Chalé inválido").nullable()),
  auto_apply: checkbox,
  active: checkbox,
});

export type FeeInput = z.infer<typeof feeSchema>;
