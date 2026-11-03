import { z } from "zod";

import { optionalText, phone, requiredText } from "@/lib/validation";

export const profileSchema = z.object({
  full_name: requiredText("Seu nome", 80),
  business_name: optionalText(80),
  phone,
  pix_key: optionalText(120),
  pix_city: optionalText(40),
});

export type ProfileInput = z.infer<typeof profileSchema>;
