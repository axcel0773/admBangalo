import { describe, expect, it } from "vitest";

import { DEFAULT_DEPOSIT_PERCENT, normalizeDepositPercent, suggestedDeposit } from "./deposit";

describe("sinal sugerido", () => {
  it("calcula o percentual em centavos", () => {
    expect(suggestedDeposit(1000, 30)).toBe(300);
    expect(suggestedDeposit(1284.5, 30)).toBe(385.35);
    expect(suggestedDeposit(333.33, 50)).toBe(166.67);
  });

  it("0% e total zerado não geram sinal; 100% é o total; acima de 100% é limitado", () => {
    expect(suggestedDeposit(1000, 0)).toBe(0);
    expect(suggestedDeposit(0, 30)).toBe(0);
    expect(suggestedDeposit(1000, 100)).toBe(1000);
    expect(suggestedDeposit(1000, 250)).toBe(1000);
  });

  it("percentual inválido volta ao padrão", () => {
    expect(normalizeDepositPercent(50)).toBe(50);
    expect(normalizeDepositPercent(0)).toBe(0);
    for (const bad of [null, undefined, -1, 101, 12.5, Number.NaN]) {
      expect(normalizeDepositPercent(bad)).toBe(DEFAULT_DEPOSIT_PERCENT);
    }
  });
});
