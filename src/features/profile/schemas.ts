import { z } from "zod";

import { integer, optionalText, phone, requiredText } from "@/lib/validation";

export const profileSchema = z.object({
  full_name: requiredText("Seu nome", 80),
  business_name: optionalText(80),
  phone,
  pix_key: optionalText(120),
  pix_city: optionalText(40),
  default_deposit_percent: integer("Sinal padrão", 0, 100),
});

export type ProfileInput = z.infer<typeof profileSchema>;
