import { describe, expect, it } from "vitest";

import { toCount } from "./search-params";

describe("toCount", () => {
  it("aceita inteiros dentro do limite", () => {
    expect(toCount("0")).toBe(0);
    expect(toCount("4")).toBe(4);
    expect(toCount("6")).toBe(6);
  });

  it("recusa vazio, ausente, decimal, negativo, texto e acima do limite", () => {
    for (const value of [undefined, "", "1.5", "-1", "abc", "7"]) expect(toCount(value)).toBeUndefined();
  });

  it("aceita limite personalizado", () => {
    expect(toCount("7", 10)).toBe(7);
  });
});
