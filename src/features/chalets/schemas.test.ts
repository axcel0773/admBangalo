import { describe, expect, it } from "vitest";

import { chaletSchema } from "./schemas";

const base = {
  name: "Bangalô 1",
  base_nightly_rate: "300,00",
  check_in_time: "14:00",
  check_out_time: "12:00",
  color: "#4A6B3A",
};

describe("chaletSchema", () => {
  it("aceita até 6 pessoas e inclui todas na diária", () => {
    const parsed = chaletSchema.safeParse({ ...base, max_guests: "6" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.base_guests).toBe(6);
  });

  it("recusa mais de 6 pessoas (regra do condomínio)", () => {
    expect(chaletSchema.safeParse({ ...base, max_guests: "7" }).success).toBe(false);
  });
});
