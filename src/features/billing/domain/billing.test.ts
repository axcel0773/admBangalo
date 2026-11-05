import { describe, expect, it } from "vitest";

import { estimateEnergy, findEnergyCharge, parseReading, pendingReading } from "./meter";
import {
  signedAmount,
  suggestedPaymentAmount,
  suggestedPaymentKind,
  validatePayment,
  type PaymentContext,
} from "./payments";
import { buildPixPayload, crc16, normalizePixKey, pixText } from "./pix";

describe("energia por medidor", () => {
  it("lê o medidor com uma casa decimal", () => {
    expect(parseReading("12.345,6")).toBe(12345.6);
    expect(parseReading("1234.56")).toBe(1234.6);
    expect(parseReading("")).toBeNull();
    expect(parseReading("-3")).toBeNull();
  });

  it("calcula consumo × tarifa de R$ 1,00 por kWh", () => {
    expect(estimateEnergy(1200, 1284.5, 1)).toEqual({ consumption: 84.5, total: 84.5, complete: true });
  });

  it("não calcula sem as duas leituras ou com leitura final menor", () => {
    expect(estimateEnergy(1200, null, 1).complete).toBe(false);
    expect(estimateEnergy(1200, 1100, 1)).toEqual({ consumption: 0, total: 0, complete: false });
  });

  it("encontra a cobrança medida de energia", () => {
    const charges = [
      { id: "a", kind: "cleaning", mode: "per_stay", meter_start: null, meter_end: null, unit_amount: 150 },
      { id: "b", kind: "energy", mode: "metered", meter_start: 10, meter_end: null, unit_amount: 1 },
    ];
    expect(findEnergyCharge(charges)?.id).toBe("b");
    expect(findEnergyCharge(charges.slice(0, 1))).toBeNull();
  });

  it("indica a leitura pendente conforme o status", () => {
    expect(pendingReading("confirmed", { start: null, end: null })).toBe("start");
    expect(pendingReading("confirmed", { start: 10, end: null })).toBeNull();
    expect(pendingReading("checked_in", { start: 10, end: null })).toBe("end");
    expect(pendingReading("checked_out", { start: 10, end: 20 })).toBeNull();
    expect(pendingReading("cancelled", { start: null, end: null })).toBeNull();
  });
});

describe("pagamentos", () => {
  const open: PaymentContext = { reservationStatus: "confirmed", paid: 500, balance: 470 };
  const cancelled: PaymentContext = { reservationStatus: "cancelled", paid: 500, balance: 470 };

  it("aceita pagamento até o saldo", () => {
    expect(validatePayment({ kind: "balance", amount: 470 }, open)).toBeNull();
    expect(validatePayment({ kind: "installment", amount: 100 }, open)).toBeNull();
  });

  it("recusa pagamento maior que o saldo", () => {
    expect(validatePayment({ kind: "balance", amount: 470.01 }, open)?.field).toBe("amount");
    expect(validatePayment({ kind: "balance", amount: 10 }, { ...open, balance: 0 })?.message).toMatch(/quitada/);
  });

  it("recusa valor zero ou negativo", () => {
    expect(validatePayment({ kind: "deposit", amount: 0 }, open)?.field).toBe("amount");
  });

  it("estorno não passa do que foi pago", () => {
    expect(validatePayment({ kind: "refund", amount: 500 }, open)).toBeNull();
    expect(validatePayment({ kind: "refund", amount: 500.5 }, open)?.field).toBe("amount");
  });

  it("reserva cancelada só aceita estorno", () => {
    expect(validatePayment({ kind: "balance", amount: 10 }, cancelled)?.field).toBe("kind");
    expect(validatePayment({ kind: "refund", amount: 200 }, cancelled)).toBeNull();
  });

  it("sugere tipo e valor do próximo lançamento", () => {
    expect(suggestedPaymentKind({ ...open, paid: 0 })).toBe("deposit");
    expect(suggestedPaymentKind(open)).toBe("balance");
    expect(suggestedPaymentKind(cancelled)).toBe("refund");
    expect(suggestedPaymentKind({ ...open, balance: 0 })).toBe("refund");
    expect(suggestedPaymentAmount(open)).toBe(470);
    expect(suggestedPaymentAmount(cancelled)).toBe(500);
    expect(suggestedPaymentAmount({ ...open, balance: -20 })).toBe(0);
  });

  it("estorno entra negativo nas somas", () => {
    expect(signedAmount({ kind: "refund", amount: 50 })).toBe(-50);
    expect(signedAmount({ kind: "deposit", amount: 50 })).toBe(50);
  });
});

describe("Pix copia e cola", () => {
  it("CRC16/CCITT-FALSE confere com o vetor padrão", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("reproduz o exemplo do manual do Banco Central", () => {
    const payload = buildPixPayload({
      key: "123e4567-e12b-12d1-a456-426655440000",
      name: "Fulano de Tal",
      city: "BRASILIA",
    });
    expect(payload).toBe(
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D",
    );
  });

  it("inclui o valor com duas casas e termina com CRC válido", () => {
    const payload = buildPixPayload({ key: "maria@exemplo.com", name: "Bangalôs da Serra", city: "Gonçalves", amount: 470 });
    expect(payload).toContain("5406470.00");
    expect(payload).toContain("5917Bangalos da Serra");
    expect(payload).toContain("6009Goncalves");
    const body = payload.slice(0, -4);
    expect(payload.slice(-4)).toBe(crc16(body));
  });

  it("normaliza as chaves como o DICT espera", () => {
    expect(normalizePixKey("Maria@Exemplo.com ")).toBe("maria@exemplo.com");
    expect(normalizePixKey("529.982.247-25")).toBe("52998224725");
    expect(normalizePixKey("(35) 99876-5432")).toBe("+5535998765432");
    expect(normalizePixKey("+55 35 99876-5432")).toBe("+5535998765432");
    expect(normalizePixKey("12.345.678/0001-90")).toBe("12345678000190");
  });

  it("limpa acentos e corta no tamanho máximo", () => {
    expect(pixText("José da Conceição & Filhos Ltda.", 25)).toBe("Jose da Conceicao Filhos");
  });
});
