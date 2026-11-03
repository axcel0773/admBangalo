import { z } from "zod";

import { checkbox, integer, money, optionalText, requiredText, time } from "@/lib/validation";

export const chaletSchema = z
  .object({
    name: requiredText("Nome", 60),
    description: optionalText(500),
    max_guests: integer("Capacidade", 1, 30),
    base_guests: integer("Hóspedes inclusos", 1, 30),
    base_nightly_rate: money("Diária"),
    check_in_time: time,
    check_out_time: time,
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Escolha uma cor"),
    active: checkbox,
  })
  .refine((data) => data.base_guests <= data.max_guests, {
    path: ["base_guests"],
    message: "Não pode passar da capacidade do chalé",
  });

export type ChaletInput = z.infer<typeof chaletSchema>;
