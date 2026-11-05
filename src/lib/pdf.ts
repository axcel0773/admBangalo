import type { PDFFont } from "pdf-lib";

/**
 * Apoio aos PDFs gerados no aparelho (pdf-lib). As fontes padrão do PDF só têm o alfabeto latino (WinAnsi).
 */

/** Troca o que a fonte padrão do PDF não consegue desenhar. */
export function winAnsiSafe(text: string): string {
  return text
    .replace(/ /g, " ")
    .replace(/−/g, "-")
    .replace(/[^ -~¡-ÿ–—‘’“”•…€]/g, "?");
}

/** Quebra o texto em linhas que cabem em `maxWidth`. */
export function wrapText(text: string, font: Pick<PDFFont, "widthOfTextAtSize">, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}
