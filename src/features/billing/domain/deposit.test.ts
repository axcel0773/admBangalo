import { describe, expect, it } from "vitest";

import { DEFAULT_DEPOSIT_PERCENT, normalizeDepositPercent, suggestedDeposit } from "./deposit";
import { contextWithout, validatePayment } from "./payments";

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

describe("editar lançamento (contextWithout)", () => {
  const context = { reservationStatus: "confirmed" as const, paid: 3500, balance: 3500.02 };

  it("corrigir o sinal de 3.500,00 para 3.500,01 é aceito", () => {
    const base = contextWithout(context, { kind: "deposit", amount: 3500 });
    expect(base).toMatchObject({ paid: 0, balance: 7000.02 });
    expect(validatePayment({ kind: "deposit", amount: 3500.01 }, base)).toBeNull();
  });

  it("a edição ainda não pode passar do total", () => {
    const base = contextWithout(context, { kind: "deposit", amount: 3500 });
    expect(validatePayment({ kind: "deposit", amount: 7000.03 }, base)?.field).toBe("amount");
  });

  it("estorno editado conta o que foi pago sem ele", () => {
    const base = contextWithout({ reservationStatus: "cancelled", paid: 300, balance: -300 }, { kind: "refund", amount: 200 });
    expect(base.paid).toBe(500);
    expect(validatePayment({ kind: "refund", amount: 500 }, base)).toBeNull();
    expect(validatePayment({ kind: "refund", amount: 501 }, base)?.field).toBe("amount");
  });
});
