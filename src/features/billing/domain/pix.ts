import { isValidCpf } from "@/lib/validation";

/**
 * "Pix copia e cola" estático com valor (BR Code, padrão EMV do Banco Central).
 * O hóspede cola o código no app do banco e o valor já vem preenchido.
 *
 * Referência: Manual de Padrões para Iniciação do Pix (BCB), seção do QR estático.
 */

export interface PixPayloadInput {
  /** Chave Pix do recebedor (CPF, CNPJ, telefone, e-mail ou aleatória). */
  key: string;
  /** Nome do recebedor (até 25 caracteres, sem acento). */
  name: string;
  /** Cidade do recebedor (até 15 caracteres, sem acento). */
  city: string;
  /** Valor em reais; omitido = o pagador digita. */
  amount?: number;
  /** Identificador que aparece no extrato (até 25 letras/números). */
  txid?: string;
}

/** Campo TLV: id (2) + tamanho (2) + valor. */
function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** Remove acentos e símbolos que os bancos rejeitam. */
export function pixText(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

/** CRC16/CCITT-FALSE (polinômio 0x1021, início 0xFFFF), exigido no campo 63. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Normaliza a chave como o DICT espera:
 * CPF/CNPJ só dígitos, telefone com +55, e-mail em minúsculas, aleatória como está.
 */
export function normalizePixKey(raw: string): string {
  const key = raw.trim();
  if (key.includes("@")) return key.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return key.toLowerCase();

  const digits = key.replace(/\D/g, "");
  if (key.startsWith("+")) return `+${digits}`;
  if (digits.length === 14) return digits; // CNPJ
  if (digits.length === 11 && isValidCpf(digits)) return digits;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;
  return key;
}

export function buildPixPayload(input: PixPayloadInput): string {
  const account = field("00", "br.gov.bcb.pix") + field("01", normalizePixKey(input.key));
  const txid = pixText(input.txid ?? "", 25).replace(/ /g, "") || "***";

  const body = [
    field("00", "01"),
    field("26", account),
    field("52", "0000"),
    field("53", "986"),
    input.amount !== undefined && input.amount > 0 ? field("54", input.amount.toFixed(2)) : "",
    field("58", "BR"),
    field("59", pixText(input.name, 25) || "RECEBEDOR"),
    field("60", pixText(input.city, 15) || "BRASIL"),
    field("62", field("05", txid)),
    "6304",
  ].join("");

  return body + crc16(body);
}
