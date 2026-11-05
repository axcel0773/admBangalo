import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { formatCurrency } from "@/lib/format";
import { winAnsiSafe, wrapText } from "@/lib/pdf";

import type { QuoteDocument } from "../domain/quote-document";

/** PDF do orçamento, gerado no próprio aparelho (sem servidor, sem custo). */

const PAGE = { width: 595.28, height: 841.89, margin: 48 };
const INK = rgb(0.114, 0.165, 0.122);
const MUTED = rgb(0.4, 0.43, 0.4);
const LINE = rgb(0.82, 0.84, 0.8);
const PANEL = rgb(0.95, 0.95, 0.92);

export async function buildQuotePdf(data: QuoteDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Orçamento ${data.number}`);
  pdf.setAuthor(winAnsiSafe(data.issuer));
  pdf.setProducer("admBangalo");
  pdf.setCreator("admBangalo");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;
  const contentWidth = right - left;

  let page: PDFPage = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;

  const ensureSpace = (height: number) => {
    if (y - height >= PAGE.margin) return;
    page = pdf.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - PAGE.margin;
  };
  const text = (value: string, x: number, size: number, font: PDFFont, color = INK) => {
    page.drawText(winAnsiSafe(value), { x, y, size, font, color });
  };
  const textRight = (value: string, size: number, font: PDFFont, color = INK) => {
    const safe = winAnsiSafe(value);
    page.drawText(safe, { x: right - font.widthOfTextAtSize(safe, size), y, size, font, color });
  };
  const rule = (thickness: number, color = INK) => {
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness, color });
  };
  const paragraph = (value: string, size: number, font: PDFFont, options: { color?: ReturnType<typeof rgb>; gap?: number } = {}) => {
    for (const line of wrapText(winAnsiSafe(value), font, size, contentWidth)) {
      ensureSpace(size + 4);
      y -= size + 2;
      page.drawText(line, { x: left, y, size, font, color: options.color ?? INK });
    }
    y -= options.gap ?? 4;
  };

  // Cabeçalho
  y -= 20;
  text(data.issuer, left, 20, bold);
  textRight("Orçamento", 16, bold);
  y -= 15;
  if (data.issuerPhone) text(data.issuerPhone, left, 10, regular, MUTED);
  textRight(`nº ${data.number}`, 10, regular, MUTED);
  y -= 13;
  textRight(`emitido em ${data.issuedAt}`, 10, regular, MUTED);
  y -= 12;
  rule(1.5);
  y -= 8;

  // Hóspede e estadia
  const labelled = (label: string, value: string, strong = false) => {
    ensureSpace(16);
    y -= 14;
    text(label, left, 10, regular, MUTED);
    const x = left + 74;
    wrapText(winAnsiSafe(value), regular, 10, right - x).forEach((line, index) => {
      if (index > 0) {
        ensureSpace(14);
        y -= 13;
      }
      page.drawText(line, { x, y, size: 10, font: strong && index === 0 ? bold : regular, color: INK });
    });
  };
  labelled("Para", data.guestName, true);
  labelled("Hospedagem", data.stay);
  labelled("Pessoas", data.people);
  labelled("Validade", `até ${data.validUntil}`);
  y -= 18;

  // Itens
  ensureSpace(40);
  text("Descrição", left, 9, bold, MUTED);
  textRight("Valor", 9, bold, MUTED);
  y -= 6;
  rule(0.6, LINE);
  const amountWidth = 90;
  for (const item of data.items) {
    const lines = wrapText(winAnsiSafe(item.description), regular, 10, contentWidth - amountWidth);
    ensureSpace(lines.length * 13 + 8);
    y -= 15;
    textRight(formatCurrency(item.amount), 10, regular);
    lines.forEach((line, index) => {
      if (index > 0) y -= 13;
      page.drawText(line, { x: left, y, size: 10, font: regular, color: INK });
    });
    y -= 6;
    rule(0.4, LINE);
  }
  ensureSpace(60);
  y -= 4;
  rule(1.2);
  y -= 17;
  text("Total", left, 12, bold);
  textRight(formatCurrency(data.total), 12, bold);
  y -= 26;

  // Avisos
  if (data.notes) paragraph(data.notes, 10, regular, { gap: 10 });
  ensureSpace(80);
  const boxHeight = data.pixKey ? 64 : 44;
  page.drawRectangle({ x: left, y: y - boxHeight, width: contentWidth, height: boxHeight, color: PANEL });
  y -= 18;
  text("Este orçamento não é uma reserva: ela só fica garantida após a confirmação.", left + 12, 9.5, bold);
  y -= 16;
  text(`Valores válidos até ${data.validUntil}.`, left + 12, 9.5, regular);
  if (data.pixKey) {
    y -= 16;
    text(`Para reservar, o sinal pode ser pago por Pix: ${data.pixKey}`, left + 12, 9.5, regular);
  }
  y -= boxHeight - (data.pixKey ? 50 : 30);

  return pdf.save();
}
