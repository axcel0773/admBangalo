import { describe, expect, it } from "vitest";

import { chargeQuantity, meteredConsumption, quoteStay } from "./pricing";
import { balanceDue, paidAmount, paidRatio, paymentStatus } from "./payments";
import type { FeeRule } from "./types";

const cleaning: FeeRule = { name: "Limpeza", kind: "cleaning", mode: "per_stay", amount: 150 };
const extraGuest: FeeRule = {
  name: "Pessoa extra",
  kind: "extra_guest",
  mode: "per_guest_night",
  amount: 60,
};
const energy: FeeRule = { name: "Energia", kind: "energy", mode: "metered", amount: 0.95 };

// Mesmo cenário validado no Postgres na parte 1.
const stay = { nights: 3, guests: 3, includedGuests: 2 };

describe("quoteStay", () => {
  it("soma hospedagem e taxas automáticas", () => {
    const quote = quoteStay({ stay, nightlyRate: 350, fees: [cleaning, extraGuest, energy] });

    expect(quote.lodging).toBe(1050);
    expect(quote.charges.map((c) => [c.description, c.total])).toEqual([
      ["Limpeza", 150],
      ["Pessoa extra", 180],
      ["Energia", 0],
    ]);
    expect(quote.total).toBe(1380);
  });

  it("omite pessoa extra quando cabe nos hóspedes inclusos", () => {
    const quote = quoteStay({
      stay: { nights: 2, guests: 2, includedGuests: 2 },
      nightlyRate: 300,
      fees: [extraGuest],
    });
    expect(quote.charges).toHaveLength(0);
    expect(quote.total).toBe(600);
  });

  it("aplica desconto na hospedagem", () => {
    const quote = quoteStay({ stay, nightlyRate: 350, discount: 50, fees: [] });
    expect(quote.lodging).toBe(1000);
  });
});

describe("chargeQuantity", () => {
  it.each([
    ["per_stay", 1],
    ["per_night", 3],
    ["per_guest", 3],
    ["per_guest_night", 9],
  ] as const)("modo %s", (mode, expected) => {
    expect(chargeQuantity({ ...cleaning, mode }, stay)).toBe(expected);
  });

  it("usa o consumo do medidor no modo metered", () => {
    expect(chargeQuantity(energy, stay, { start: 1000, end: 1084.5 })).toBe(84.5);
  });
});

describe("meteredConsumption", () => {
  it("é zero sem leitura final", () => {
    expect(meteredConsumption({ start: 1000, end: null })).toBe(0);
  });

  it("recusa leitura final menor que a inicial", () => {
    expect(() => meteredConsumption({ start: 10, end: 5 })).toThrow(RangeError);
  });
});

describe("pagamentos", () => {
  const total = 1460.28;

  it("desconta estornos do valor pago", () => {
    expect(
      paidAmount([
        { kind: "deposit", amount: 600 },
        { kind: "refund", amount: 100 },
      ]),
    ).toBe(500);
  });

  it("calcula saldo e status parcial", () => {
    const paid = paidAmount([{ kind: "deposit", amount: 600 }]);
    expect(balanceDue(total, paid)).toBe(860.28);
    expect(paymentStatus({ reservationStatus: "confirmed", total, paid })).toBe("partial");
  });

  it("marca cancelada independente do valor", () => {
    expect(paymentStatus({ reservationStatus: "cancelled", total, paid: total })).toBe("cancelled");
  });

  it("limita a fração paga entre 0 e 1", () => {
    expect(paidRatio(100, 150)).toBe(1);
    expect(paidRatio(0, 0)).toBe(0);
  });
});
