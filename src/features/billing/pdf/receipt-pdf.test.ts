import { describe, expect, it } from "vitest";

import { winAnsiSafe, wrapText } from "@/lib/pdf";

import type { ReceiptData } from "../domain/receipt";
import { buildReceiptPdf } from "./receipt-pdf";

const data: ReceiptData = {
  number: "A1B2C3D4",
  issuer: "Chalés da Serra",
  issuerPhone: "(12) 99999-0000",
  issuedAt: "04/11",
  guestName: "Maria Souza 🙂",
  guestDocument: null,
  stay: "Bangalô Asahi · entrada 10/12 às 14:00 · saída 13/12 às 12:00",
  people: "4 pessoas",
  items: [{ description: "Hospedagem: 3 noites × R$ 350,00", amount: 1050 }],
  total: 1050,
  payments: [{ paidAt: "2026-11-01", kindLabel: "Sinal", methodLabel: "Pix", label: "01/11 · Sinal · Pix", amount: 525, refund: false }],
  paid: 525,
  balance: 525,
};

describe("winAnsiSafe", () => {
  it("mantém acentos e troca o que a fonte do PDF não desenha", () => {
    expect(winAnsiSafe("Hóspede João · R$ 1.050,00 × 3")).toBe("Hóspede João · R$ 1.050,00 × 3");
    expect(winAnsiSafe("−R$ 50")).toBe("-R$ 50");
    expect(winAnsiSafe("Ana 🙂")).toBe("Ana ??");
  });
});

describe("wrapText", () => {
  const font = { widthOfTextAtSize: (text: string) => text.length * 5 };

  it("quebra nas palavras e respeita a largura", () => {
    expect(wrapText("um dois três quatro", font, 10, 50)).toEqual(["um dois", "três", "quatro"]);
  });

  it("texto vazio vira uma linha vazia", () => {
    expect(wrapText("", font, 10, 50)).toEqual([""]);
  });
});

describe("buildReceiptPdf", () => {
  it("gera um PDF válido de uma página, mesmo com emoji no nome", async () => {
    const bytes = await buildReceiptPdf(data);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1500);
  });

  it("passa para a segunda página quando há muitas linhas", async () => {
    const many = { ...data, items: Array.from({ length: 70 }, (_, i) => ({ description: `Item ${i}`, amount: i })) };
    const { PDFDocument } = await import("pdf-lib");
    const pdf = await PDFDocument.load(await buildReceiptPdf(many));
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
