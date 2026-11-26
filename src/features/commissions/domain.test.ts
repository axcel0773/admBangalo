import { describe, expect, it } from "vitest";

import { commissionForPercent, commissionOf, describeCommissionShare, totalCommissions, uniqueBrokerNames } from "./domain";

describe("comissão do corretor", () => {
  it("lê a comissão das colunas da reserva", () => {
    expect(commissionOf({ broker_name: null, commission_amount: null, commission_paid_on: null, commission_method: null })).toBeNull();
    expect(
      commissionOf({ broker_name: "Carlos", commission_amount: 120, commission_paid_on: "2026-11-25", commission_method: "pix" }),
    ).toEqual({ brokerName: "Carlos", amount: 120, paidOn: "2026-11-25", method: "pix" });
  });

  it("atalhos de porcentagem dão reais inteiros", () => {
    expect(commissionForPercent(1200, 10)).toBe(120);
    expect(commissionForPercent(1333.33, 5)).toBe(67);
    expect(commissionForPercent(0, 10)).toBe(0);
  });

  it("descreve a parte do total", () => {
    expect(describeCommissionShare(120, 1200)).toBe("10% do total");
    expect(describeCommissionShare(90, 1200)).toBe("7,5% do total");
    expect(describeCommissionShare(120, 0)).toBeNull();
  });

  it("sugere cada corretor uma vez, em ordem alfabética", () => {
    expect(uniqueBrokerNames(["Carlos", " carlos ", null, "Ana", ""])).toEqual(["Ana", "Carlos"]);
  });
});

describe("totalCommissions", () => {
  it("soma sem erro de centavos", () => {
    expect(totalCommissions([{ commission_amount: 0.1 }, { commission_amount: 0.2 }, { commission_amount: null }])).toBe(0.3);
  });
});
