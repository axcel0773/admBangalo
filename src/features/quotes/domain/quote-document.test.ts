import { describe, expect, it } from "vitest";

import {
  buildQuoteDocument,
  buildQuoteLines,
  parseQuoteLines,
  quoteFileName,
  quoteMessage,
  validUntilFrom,
} from "./quote-document";

const quote = {
  id: "a1b2c3d4-0000-4000-8000-000000000000",
  guest_name: "Maria Souza",
  check_in: "2026-12-20",
  check_out: "2026-12-22",
  adults: 2,
  children: 2,
  lines: [
    { description: "Hospedagem", amount: 900 },
    { description: "Limpeza", amount: 80 },
  ],
  total: 980,
  notes: null,
  valid_until: "2026-11-12",
  created_at: "2026-11-05T13:00:00Z",
};
const chalet = { name: "Bangalô Asahi", check_in_time: "14:00:00", check_out_time: "12:00:00" };
const base = { quote, chalet, issuer: "Chalés Guaratiba", issuerPhone: null, pixKey: "chave@exemplo.com" };

describe("orçamento", () => {
  it("monta as linhas de hospedagem e taxas", () => {
    const lines = buildQuoteLines({
      nights: 2,
      nightlyRate: 450,
      discount: 50,
      lodging: 850,
      charges: [
        { description: "Limpeza", mode: "per_stay", quantity: 1, unitAmount: 80, total: 80 },
        { description: "Pet", mode: "per_stay", quantity: 2, unitAmount: 30, total: 60 },
        { description: "Energia elétrica", mode: "metered", quantity: 0, unitAmount: 1, total: 0 },
      ],
    });
    expect(lines.map((line) => line.amount)).toEqual([850, 80, 60, 0]);
    expect(lines[0]?.description).toContain("2 noites");
    expect(lines[0]?.description).toContain("desconto");
    expect(lines[2]?.description).toContain("2 ×");
    expect(lines[3]?.description).toContain("calculada na saída");
    expect(lines[3]?.pending).toBe(true);
    expect(lines[1]?.pending).toBeUndefined();
  });

  it("calcula a validade", () => {
    expect(validUntilFrom("2026-11-05", 7)).toBe("2026-11-12");
  });

  it("lê o jsonb ignorando itens inválidos", () => {
    expect(parseQuoteLines([{ description: "A", amount: 1 }, { description: 2 }, null, "x"])).toEqual([
      { description: "A", amount: 1 },
    ]);
    expect(parseQuoteLines("nada")).toEqual([]);
    // Orçamento antigo (sem a marca): a taxa medida continua aparecendo como “a calcular”.
    expect(parseQuoteLines([{ description: "Energia (calculada na saída)", amount: 0 }])[0]?.pending).toBe(true);
  });

  it("marca como vencido depois da validade", () => {
    expect(buildQuoteDocument({ ...base, today: "2026-11-12" }).expired).toBe(false);
    expect(buildQuoteDocument({ ...base, today: "2026-11-13" }).expired).toBe(true);
  });

  it("descreve estadia, pessoas e total", () => {
    const doc = buildQuoteDocument({ ...base, today: "2026-11-05" });
    expect(doc.number).toBe("A1B2C3D4");
    expect(doc.stay).toContain("2 noites");
    expect(doc.nights).toBe(2);
    expect(doc.checkIn).toBe("20/12/2026 às 14:00");
    expect(doc.checkOut).toBe("22/12/2026 às 12:00");
    expect(doc.validUntil).toBe("12/11/2026");
    expect(doc.issuedAt).toBe("05/11/2026");
    expect(doc.people).toBe("4 pessoas");
    expect(doc.total).toBe(980);
  });

  it("gera nome de arquivo e mensagem", () => {
    const doc = buildQuoteDocument({ ...base, today: "2026-11-05" });
    expect(quoteFileName(doc)).toBe("orcamento-A1B2C3D4-maria-souza.pdf");
    const message = quoteMessage(doc);
    expect(message).toContain("Olá, Maria!");
    expect(message).toContain("Válido até");
    expect(message).not.toContain(" ");
  });
});
