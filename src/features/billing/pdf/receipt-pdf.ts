import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { formatCurrency } from "@/lib/format";
import { winAnsiSafe, wrapText } from "@/lib/pdf";

import type { ReceiptData } from "../domain/receipt";

/**
 * PDF do recibo, gerado no próprio aparelho (sem servidor, sem custo).
 * As fontes padrão do PDF só têm o alfabeto latino (WinAnsi): acentos do português
 * funcionam; qualquer outro caractere (emoji, por exemplo) vira "?".
 */

const PAGE = { width: 595.28, height: 841.89, margin: 48 };
const INK = rgb(0.114, 0.165, 0.122);
const MUTED = rgb(0.4, 0.43, 0.4);
const LINE = rgb(0.82, 0.84, 0.8);
const PANEL = rgb(0.95, 0.95, 0.92);

const money = (value: number, refund = false) => `${refund ? "-" : ""}${formatCurrency(value)}`;

export async function buildReceiptPdf(data: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Recibo ${data.number}`);
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
  /** Parágrafo com quebra de linha; devolve quando terminou. */
  const paragraph = (value: string, size: number, font: PDFFont, options: { x?: number; width?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) => {
    const x = options.x ?? left;
    const lines = wrapText(winAnsiSafe(value), font, size, options.width ?? contentWidth - (x - left));
    for (const line of lines) {
      ensureSpace(size + 4);
      y -= size + 2;
      page.drawText(line, { x, y, size, font, color: options.color ?? INK });
    }
    y -= options.gap ?? 4;
  };

  // Cabeçalho
  y -= 20;
  text(data.issuer, left, 20, bold);
  textRight("Recibo", 16, bold);
  y -= 15;
  if (data.issuerPhone) text(data.issuerPhone, left, 10, regular, MUTED);
  textRight(`nº ${data.number}`, 10, regular, MUTED);
  y -= 13;
  textRight(`emitido em ${data.issuedAt}`, 10, regular, MUTED);
  y -= 12;
  rule(1.5);
  y -= 8;

  // Hóspede e estadia
  const labelled = (label: string, value: string) => {
    ensureSpace(16);
    y -= 14;
    text(label, left, 10, regular, MUTED);
    const x = left + 74;
    const lines = wrapText(winAnsiSafe(value), regular, 10, right - x);
    lines.forEach((line, index) => {
      if (index > 0) {
        ensureSpace(14);
        y -= 13;
      }
      page.drawText(line, { x, y, size: 10, font: index === 0 && label === "Hóspede" ? bold : regular, color: INK });
    });
  };
  labelled("Hóspede", data.guestDocument ? `${data.guestName} · ${data.guestDocument}` : data.guestName);
  labelled("Hospedagem", data.stay);
  labelled("Pessoas", data.people);
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
    textRight(money(item.amount), 10, regular);
    lines.forEach((line, index) => {
      if (index > 0) y -= 13;
      page.drawText(line, { x: left, y, size: 10, font: regular, color: INK });
    });
    y -= 6;
    rule(0.4, LINE);
  }
  ensureSpace(34);
  y -= 4;
  rule(1.2);
  y -= 17;
  text("Total", left, 11, bold);
  textRight(money(data.total), 11, bold);
  y -= 26;

  // Pagamentos
  ensureSpace(46);
  text("Pagamentos", left, 13, bold);
  y -= 6;
  if (data.payments.length === 0) {
    paragraph("Nenhum pagamento registrado.", 10, regular, { color: MUTED, gap: 14 });
  } else {
    for (const payment of data.payments) {
      ensureSpace(22);
      y -= 15;
      text(payment.label, left, 10, regular);
      textRight(money(payment.amount, payment.refund), 10, regular);
      y -= 5;
      rule(0.4, LINE);
    }
    y -= 8;
  }

  // Resumo
  ensureSpace(70);
  const boxHeight = 52;
  page.drawRectangle({ x: left, y: y - boxHeight, width: contentWidth, height: boxHeight, color: PANEL });
  const summaryRow = (label: string, value: string) => {
    const safe = winAnsiSafe(value);
    text(label, left + 14, 10.5, regular);
    page.drawText(safe, { x: right - 14 - bold.widthOfTextAtSize(safe, 10.5), y, size: 10.5, font: bold, color: INK });
  };
  y -= 21;
  summaryRow("Total pago", money(Math.max(data.paid, 0)));
  y -= 19;
  summaryRow("Saldo a pagar", money(data.balance));
  y -= 36;

  // Declaração e assinatura
  paragraph(
    `Recebemos de ${data.guestName} a quantia de ${money(Math.max(data.paid, 0))} referente à hospedagem descrita acima.`,
    10.5,
    regular,
    { gap: 8 },
  );
  ensureSpace(80);
  y -= 46;
  page.drawLine({ start: { x: left, y }, end: { x: left + 190, y }, thickness: 0.8, color: INK });
  y -= 13;
  const issuer = winAnsiSafe(data.issuer);
  text(issuer, left + 95 - bold.widthOfTextAtSize(issuer, 10) / 2, 10, bold);

  return pdf.save();
}
