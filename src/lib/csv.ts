/**
 * CSV no formato do Excel em português: `;` entre colunas, vírgula decimal,
 * \r\n entre linhas e BOM no download (acentos).
 */

const NUMERIC = /^-?\d+(,\d+)?$/;

/**
 * Uma célula. Texto que começa com = + - @ (ou tab/CR) é aberto pelo Excel como
 * fórmula ("CSV injection"): um nome de hóspede como `=HYPERLINK(...)` viraria
 * link malicioso. Prefixar com ' faz o Excel mostrar como texto. Números
 * (inclusive negativos, como "-50,00") ficam como estão.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text) && !NUMERIC.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Dinheiro como o Excel brasileiro lê (vírgula decimal, sem milhar). */
export const csvNumber = (value: number) => value.toFixed(2).replace(".", ",");

/** "2026-11-10" → "10/11/2026" */
export const csvDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  return [header.map(csvCell).join(";"), ...rows.map((row) => row.map(csvCell).join(";"))].join("\r\n");
}

/** Resposta de download com BOM (o Excel reconhece UTF-8 ao abrir com dois cliques). */
export function csvResponseInit(filename: string): ResponseInit {
  return {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  };
}

export const CSV_BOM = "﻿";
