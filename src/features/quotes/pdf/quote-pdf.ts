import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { formatCurrency } from "@/lib/format";
import { winAnsiSafe, wrapText } from "@/lib/pdf";

import type { QuoteDocument } from "../domain/quote-document";

/**
 * PDF do orçamento, gerado no próprio aparelho (sem servidor, sem custo).
 * Cores da marca do app: verde da faixa e do total, fundo creme nas caixas.
 */

const PAGE = { width: 595.28, height: 841.89, margin: 44 };
const INK = rgb(0.17, 0.15, 0.125);
const MUTED = rgb(0.42, 0.38, 0.34);
const LINE = rgb(0.9, 0.86, 0.8);
const GREEN = rgb(0.122, 0.435, 0.698);
const GREEN_SOFT = rgb(0.86, 0.92, 0.97);
const CREAM = rgb(0.976, 0.957, 0.925);
const WHITE = rgb(1, 1, 1);
const ON_GREEN_MUTED = rgb(0.84, 0.91, 0.96);

const BAND_HEIGHT = 92;

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
  let y = PAGE.height;

  const ensureSpace = (height: number) => {
    if (y - height >= PAGE.margin + 24) return;
    page = pdf.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - PAGE.margin;
  };
  const draw = (value: string, x: number, size: number, font: PDFFont, color = INK) => {
    page.drawText(winAnsiSafe(value), { x, y, size, font, color });
  };
  const drawRight = (value: string, xRight: number, size: number, font: PDFFont, color = INK) => {
    const safe = winAnsiSafe(value);
    page.drawText(safe, { x: xRight - font.widthOfTextAtSize(safe, size), y, size, font, color });
  };

  // Faixa de topo
  page.drawRectangle({ x: 0, y: PAGE.height - BAND_HEIGHT, width: PAGE.width, height: BAND_HEIGHT, color: GREEN });
  y = PAGE.height - 42;
  draw(data.issuer, left, 22, bold, WHITE);
  drawRight("ORÇAMENTO", right, 13, bold, WHITE);
  y -= 18;
  if (data.issuerPhone) draw(data.issuerPhone, left, 10.5, regular, ON_GREEN_MUTED);
  drawRight(`nº ${data.number}  ·  emitido em ${data.issuedAt}`, right, 9.5, regular, ON_GREEN_MUTED);
  y = PAGE.height - BAND_HEIGHT - 30;

  // Para quem + validade
  const forWidth = contentWidth - 150;
  draw("PARA", left, 8.5, bold, MUTED);
  drawRight("VÁLIDO ATÉ", right, 8.5, bold, MUTED);
  y -= 19;
  const nameLines = wrapText(winAnsiSafe(data.guestName), bold, 17, forWidth);
  nameLines.forEach((line, index) => {
    if (index > 0) y -= 20;
    page.drawText(line, { x: left, y, size: 17, font: bold, color: INK });
  });
  const validColor = data.expired ? rgb(0.58, 0.21, 0.16) : GREEN;
  drawRight(data.validUntil, right, 17, bold, validColor);
  y -= 26;

  // Dados da estadia em quatro blocos
  const boxHeight = 56;
  page.drawRectangle({ x: left, y: y - boxHeight, width: contentWidth, height: boxHeight, color: CREAM });
  const cells = [
    { label: "CHALÉ", value: data.chaletName, width: 0.28 },
    { label: "ENTRADA", value: data.checkIn, width: 0.27 },
    { label: "SAÍDA", value: data.checkOut, width: 0.27 },
    { label: "PESSOAS", value: data.people, width: 0.18 },
  ];
  let cellX = left + 14;
  for (const cell of cells) {
    const width = contentWidth * cell.width;
    const top = y;
    y = top - 19;
    draw(cell.label, cellX, 8, bold, MUTED);
    y -= 17;
    const lines = wrapText(winAnsiSafe(cell.value), bold, 10, width - 12).slice(0, 2);
    lines.forEach((line, index) => {
      page.drawText(line, { x: cellX, y: y - index * 12, size: 10, font: bold, color: INK });
    });
    y = top;
    cellX += width;
  }
  y -= boxHeight + 16;
  draw(`${data.nights} ${data.nights === 1 ? "noite" : "noites"} de hospedagem`, left + 14, 9.5, regular, MUTED);
  y -= 26;

  // Tabela de itens
  const amountRight = right - 12;
  page.drawRectangle({ x: left, y: y - 8, width: contentWidth, height: 26, color: GREEN_SOFT });
  y -= 1;
  draw("DESCRIÇÃO", left + 12, 8.5, bold, GREEN);
  drawRight("VALOR", amountRight, 8.5, bold, GREEN);
  y -= 22;
  for (const [index, item] of data.items.entries()) {
    const lines = wrapText(winAnsiSafe(item.description), regular, 10.5, contentWidth - 130);
    const rowHeight = lines.length * 14 + 14;
    ensureSpace(rowHeight + 60);
    if (index % 2 === 1) {
      page.drawRectangle({ x: left, y: y - rowHeight + 11, width: contentWidth, height: rowHeight, color: CREAM });
    }
    drawRight(item.pending ? "a calcular" : formatCurrency(item.amount), amountRight, 10.5, item.pending ? regular : bold, item.pending ? MUTED : INK);
    lines.forEach((line, lineIndex) => {
      page.drawText(line, { x: left + 12, y: y - lineIndex * 14, size: 10.5, font: regular, color: INK });
    });
    y -= rowHeight;
  }
  page.drawLine({ start: { x: left, y: y + 11 }, end: { x: right, y: y + 11 }, thickness: 0.6, color: LINE });
  y -= 14;

  // Total em destaque
  ensureSpace(70);
  page.drawRectangle({ x: left, y: y - 34, width: contentWidth, height: 46, color: GREEN });
  y -= 16;
  draw("TOTAL", left + 16, 10, bold, ON_GREEN_MUTED);
  y -= 2;
  drawRight(formatCurrency(data.total), right - 16, 20, bold, WHITE);
  y -= 46;

  // Observações
  if (data.notes) {
    ensureSpace(60);
    draw("OBSERVAÇÕES", left, 8.5, bold, MUTED);
    y -= 6;
    for (const line of wrapText(winAnsiSafe(data.notes), regular, 10.5, contentWidth)) {
      ensureSpace(18);
      y -= 15;
      page.drawText(line, { x: left, y, size: 10.5, font: regular, color: INK });
    }
    y -= 20;
  }

  // Como reservar
  const infoLines = [
    { text: "Este orçamento não é uma reserva: ela só fica garantida após a confirmação.", strong: true },
    { text: `Valores válidos até ${data.validUntil}.`, strong: false },
    ...(data.pixKey ? [{ text: `Para reservar, o sinal pode ser pago por Pix. Chave: ${data.pixKey}`, strong: false }] : []),
  ];
  const wrapped = infoLines.flatMap((info) =>
    wrapText(winAnsiSafe(info.text), info.strong ? bold : regular, 10, contentWidth - 36).map((line, index) => ({
      line,
      strong: info.strong,
      gap: index === 0 ? 5 : 0,
    })),
  );
  const infoHeight = 36 + wrapped.reduce((sum, row) => sum + 13 + row.gap, 0);
  ensureSpace(infoHeight + 10);
  page.drawRectangle({ x: left, y: y - infoHeight + 10, width: contentWidth, height: infoHeight, color: CREAM });
  page.drawRectangle({ x: left, y: y - infoHeight + 10, width: 4, height: infoHeight, color: GREEN });
  y -= 6;
  draw("COMO RESERVAR", left + 18, 8.5, bold, GREEN);
  y -= 6;
  for (const row of wrapped) {
    y -= 13 + row.gap;
    page.drawText(row.line, { x: left + 18, y, size: 10, font: row.strong ? bold : regular, color: INK });
  }

  // Rodapé na última página
  const footer = winAnsiSafe(`Orçamento emitido por ${data.issuer}`);
  page.drawLine({ start: { x: left, y: PAGE.margin }, end: { x: right, y: PAGE.margin }, thickness: 0.5, color: LINE });
  page.drawText(footer, {
    x: PAGE.width / 2 - regular.widthOfTextAtSize(footer, 8.5) / 2,
    y: PAGE.margin - 14,
    size: 8.5,
    font: regular,
    color: MUTED,
  });

  return pdf.save();
}
