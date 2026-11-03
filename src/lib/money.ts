/**
 * Converte texto digitado em número: "1.234,56", "1234.56", "R$ 350", "0,95".
 * Retorna null quando não dá para entender o valor.
 * Usado pela validação no servidor e pelas prévias no cliente (mesma regra).
 */
export function parseMoney(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const cleaned = raw
    .replace(/\s|R\$/g, "")
    // ponto de milhar: seguido de exatamente 3 dígitos e depois fim ou não-dígito
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  if (!cleaned || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}
