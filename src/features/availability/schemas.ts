import { z } from "zod";

import { isoDate, requiredText } from "@/lib/validation";

import { icalUrlProblem } from "./domain/ical";

/** Bloqueio manual: primeira e última noite (inclusive), como o dono pensa. */
export const blockSchema = z
  .object({
    reason: requiredText("Motivo", 60),
    first_night: isoDate("Primeira noite"),
    last_night: isoDate("Última noite"),
  })
  .refine((input) => input.last_night >= input.first_night, {
    path: ["last_night"],
    message: "A última noite precisa ser igual ou depois da primeira",
  });

export type BlockInput = z.infer<typeof blockSchema>;

export const icalSourceSchema = z.object({
  label: requiredText("Nome", 40),
  url: z
    .string()
    .trim()
    .min(1, "Cole o link do calendário")
    .superRefine((value, ctx) => {
      const problem = icalUrlProblem(value);
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    }),
});

export type IcalSourceInput = z.infer<typeof icalSourceSchema>;
