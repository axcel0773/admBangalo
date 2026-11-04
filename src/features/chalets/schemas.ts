import { z } from "zod";

import { checkbox, integer, isoDate, money, optionalText, requiredText, time } from "@/lib/validation";

import { MAX_CHALET_GUESTS } from "./domain";

export const chaletSchema = z
  .object({
    name: requiredText("Nome", 60),
    description: optionalText(500),
    max_guests: integer("Capacidade", 1, MAX_CHALET_GUESTS),
    base_nightly_rate: money("Diária"),
    check_in_time: time,
    check_out_time: time,
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Escolha uma cor"),
    active: checkbox,
  })
  // Sem taxa de pessoa extra: todos os hóspedes estão inclusos na diária.
  .transform((data) => ({ ...data, base_guests: data.max_guests }));

export type ChaletInput = z.infer<typeof chaletSchema>;

/** Temporada: datas da primeira e da última noite (inclusive), como o dono pensa. */
export const seasonRateSchema = z
  .object({
    label: requiredText("Nome da temporada", 60),
    first_night: isoDate("Primeira noite"),
    last_night: isoDate("Última noite"),
    nightly_rate: money("Diária").refine((value) => value > 0, "Informe a diária da temporada"),
    min_nights: integer("Mínimo de noites", 1, 60),
  })
  .refine((input) => input.last_night >= input.first_night, {
    path: ["last_night"],
    message: "A última noite precisa ser igual ou depois da primeira",
  });

export type SeasonRateInput = z.infer<typeof seasonRateSchema>;
