import { z } from "zod";

import { isoDate, money, optionalText } from "@/lib/validation";

import { EXPENSE_CATEGORIES } from "./domain";

export const expenseSchema = z.object({
  category: z.enum(Object.keys(EXPENSE_CATEGORIES) as [keyof typeof EXPENSE_CATEGORIES, ...(keyof typeof EXPENSE_CATEGORIES)[]], {
    errorMap: () => ({ message: "Escolha a categoria" }),
  }),
  description: optionalText(120),
  amount: money("Valor").refine((value) => value > 0, "O valor precisa ser maior que zero"),
  spent_on: isoDate("Data"),
  // "" = despesa geral (não é de um bangalô só)
  chalet_id: z
    .string()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(z.string().uuid("Bangalô inválido").nullable()),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
