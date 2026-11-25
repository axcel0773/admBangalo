import { describe, expect, it } from "vitest";

import { DEFAULT_PACKAGE_NAME, lodgingBasis, lodgingLine, resolveLodgingPricing } from "./lodging";
import { averageNightlyRate, lodgingTotal, quoteStay } from "./pricing";

// O toLocaleString do real usa espaço não separável (U+00A0) depois de "R$".
const text = (value: string) => value.replace(/ /g, " ");

describe("pacote (valor fechado)", () => {
  it("fecha a hospedagem no valor do pacote, sem os centavos da diária quebrada", () => {
    // Antes: diária 333,33 × 3 = 999,99. Agora: o pacote vale 1.000,00.
    expect(lodgingTotal(3, 333.33)).toBe(999.99);
    expect(lodgingTotal(3, 333.33, 0, 1000)).toBe(1000);
    expect(lodgingTotal(3, 333.33, 50, 1000)).toBe(950);
  });

  it("quoteStay soma o pacote com as taxas", () => {
    const quote = quoteStay({
      stay: { nights: 3, guests: 2, includedGuests: 2 },
      nightlyRate: 333.33,
      packageTotal: 1000,
      fees: [{ name: "Limpeza", kind: "cleaning", mode: "per_stay", amount: 80 }],
    });
    expect(quote.lodging).toBe(1000);
    expect(quote.total).toBe(1080);
  });

  it("diária média é só informativa", () => {
    expect(averageNightlyRate(1000, 3)).toBe(333.33);
    expect(averageNightlyRate(1250, 0)).toBe(1250);
  });
});

describe("resolveLodgingPricing", () => {
  it("por diária não grava pacote", () => {
    expect(resolveLodgingPricing({ mode: "nightly", nights: 3, nightlyRate: 350 })).toEqual({
      nightly_rate: 350,
      package_name: null,
      package_total: null,
    });
  });

  it("pacote grava nome, total e a diária média", () => {
    expect(resolveLodgingPricing({ mode: "package", nights: 3, packageName: " Fim de semana ", packageTotal: 1000 })).toEqual({
      nightly_rate: 333.33,
      package_name: "Fim de semana",
      package_total: 1000,
    });
  });

  it("valor digitado sem pacote salvo ganha o nome padrão", () => {
    expect(resolveLodgingPricing({ mode: "package", nights: 2, packageTotal: 700 }).package_name).toBe(DEFAULT_PACKAGE_NAME);
  });
});

describe("texto da hospedagem", () => {
  it("por diária mostra noites × diária", () => {
    expect(text(lodgingBasis({ nights: 3, nightlyRate: 350 }))).toBe("3 noites × R$ 350,00");
  });

  it("pacote não mostra a diária", () => {
    expect(lodgingBasis({ nights: 3, nightlyRate: 333.33, packageName: "Fim de semana" })).toBe("pacote Fim de semana (3 noites)");
    expect(lodgingBasis({ nights: 1, nightlyRate: 500, packageName: DEFAULT_PACKAGE_NAME })).toBe("pacote fechado (1 noite)");
  });

  it("linha do orçamento e do recibo, com desconto", () => {
    expect(text(lodgingLine({ nights: 3, nightlyRate: 333.33, discount: 50, packageName: "Feriado" }))).toBe(
      "Hospedagem: pacote Feriado (3 noites) − desconto R$ 50,00",
    );
    expect(text(lodgingLine({ nights: 2, nightlyRate: 350, discount: 0 }))).toBe("Hospedagem: 2 noites × R$ 350,00");
  });
});
