import { z } from "zod";

import { integer, money, requiredText } from "@/lib/validation";

import { MAX_PACKAGE_NIGHTS } from "./domain";

export const packageSchema = z.object({
  name: requiredText("Nome", 60),
  nights: integer("Noites", 1, MAX_PACKAGE_NIGHTS),
  total: money("Valor total").refine((value) => value > 0, "Informe o valor do pacote"),
});

export type PackageInput = z.infer<typeof packageSchema>;
