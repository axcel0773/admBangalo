import { describe, expect, it } from "vitest";

import type { QuoteDocument } from "../domain/quote-document";
import { buildQuotePdf } from "./quote-pdf";

const doc: QuoteDocument = {
  number: "A1B2C3D4",
  issuer: "Bangalôs da Serra",
  issuerPhone: "(11) 98765-4321",
  issuedAt: "05/11/2026",
  validUntil: "12/11/2026",
  expired: false,
  guestName: "Maria Souza",
  chaletName: "Bangalô Asahi",
  checkIn: "20/12/2026 às 14:00",
  checkOut: "22/12/2026 às 12:00",
  nights: 2,
  stay: "Bangalô Asahi · entrada 20/12 às 14:00 · saída 22/12 às 12:00 · 2 noites",
  people: "4 pessoas",
  items: [
    { description: "Hospedagem: 2 noites × R$ 450,00", amount: 900 },
    { description: "Limpeza", amount: 80 },
    { description: "Energia elétrica (calculada na saída)", amount: 0, pending: true },
  ],
  total: 980,
  notes: "Aceitamos pets de pequeno porte 🐶",
  pixKey: "chave@exemplo.com",
};

describe("buildQuotePdf", () => {
  it("gera um PDF válido, mesmo com emoji no texto", async () => {
    const bytes = await buildQuotePdf(doc);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("aceita orçamento sem Pix, sem telefone e com muitas linhas", async () => {
    const many = Array.from({ length: 60 }, (_, index) => ({ description: `Taxa ${index + 1}`, amount: 10 }));
    const bytes = await buildQuotePdf({ ...doc, pixKey: null, issuerPhone: null, notes: null, items: many });
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
