import { describe, expect, it } from "vitest";

import { buildReceiptData, chargeLabel, receiptFileName, type ReceiptInput } from "./receipt";

const plain = (text: string) => text.replace(/ /g, " ");

const input: ReceiptInput = {
  reservationId: "a1b2c3d4-0000-4000-8000-000000000001",
  issuer: "Chalés da Serra",
  issuerPhone: "(12) 99999-0000",
  today: "2026-11-04",
  guest: { full_name: "Maria Souza", document: "529.982.247-25" },
  guestNames: [],
  chalet: { name: "Bangalô Asahi", check_in_time: "14:00:00", check_out_time: "12:00:00" },
  reservation: {
    check_in: "2026-12-10",
    check_out: "2026-12-13",
    nights: 3,
    nightly_rate: 350,
    discount: 50,
    lodging_total: 1000,
    adults: 4,
    children: 1,
  },
  charges: [
    { description: "Energia elétrica", mode: "metered", quantity: 12.5, unit_amount: 1, total: 12.5 },
    { description: "Limpeza", mode: "fixed", quantity: 1, unit_amount: 150, total: 150 },
    { description: "Pet", mode: "per_unit", quantity: 2, unit_amount: 30, total: 60 },
  ],
  payments: [
    { paid_at: "2026-11-01", kind: "deposit", method: "pix", amount: 650 },
    { paid_at: "2026-11-05", kind: "refund", method: "cash", amount: 50 },
  ],
  grandTotal: 1222.5,
  paid: 600,
  balanceDue: 622.5,
};

describe("dados do recibo", () => {
  const data = buildReceiptData(input);

  it("numera pelo início do id da reserva", () => {
    expect(data.number).toBe("A1B2C3D4");
    expect(data.issuedAt).toBe("04/11");
  });

  it("descreve estadia e usa a contagem de pessoas quando não há nomes", () => {
    expect(data.stay).toBe("Bangalô Asahi · entrada 10/12 às 14:00 · saída 13/12 às 12:00");
    expect(data.people).toBe("5 pessoas");
    expect(buildReceiptData({ ...input, guestNames: ["Maria", "João"] }).people).toBe("Maria, João");
  });

  it("lista hospedagem com desconto e as taxas com o detalhe", () => {
    expect(data.items.map((item) => plain(item.description))).toEqual([
      "Hospedagem: 3 noites × R$ 350,00 − desconto R$ 50,00",
      "Energia elétrica (12,5 kWh × R$ 1,00)",
      "Limpeza",
      "Pet (2 × R$ 30,00)",
    ]);
    expect(data.items[0]?.amount).toBe(1000);
  });

  it("marca estorno e nunca mostra saldo negativo", () => {
    expect(data.payments.map((payment) => [payment.kindLabel, payment.methodLabel, payment.refund])).toEqual([
      ["Sinal", "Pix", false],
      ["Estorno", "Dinheiro", true],
    ]);
    expect(buildReceiptData({ ...input, balanceDue: -20 }).balance).toBe(0);
  });
});

describe("chargeLabel e nome do arquivo", () => {
  it("só mostra a conta quando há quantidade diferente de 1", () => {
    expect(chargeLabel({ description: "Limpeza", mode: "fixed", quantity: 1, unit_amount: 150, total: 150 })).toBe("Limpeza");
  });

  it("nome do arquivo sem acento nem caractere estranho", () => {
    expect(receiptFileName({ number: "A1B2C3D4", guestName: "José Ávila d'Ângelo" })).toBe("recibo-A1B2C3D4-jose-avila-d-angelo.pdf");
    expect(receiptFileName({ number: "A1B2C3D4", guestName: "🙂" })).toBe("recibo-A1B2C3D4.pdf");
  });
});
