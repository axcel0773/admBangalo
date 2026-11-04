import { isValidCpf } from "./validation";

/**
 * Máscaras e validações instantâneas dos campos (no navegador).
 * O servidor valida de novo com zod: isto só ajuda a digitar certo.
 */

export type MaskKind = "phone" | "cpf" | "document" | "money" | "decimal" | "integer" | "uf" | "time";

const digits = (value: string) => value.replace(/\D/g, "");

/** (11) 98765-4321 ou (11) 3456-7890 */
export function maskPhone(value: string): string {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 529.982.247-25 */
export function maskCpf(value: string): string {
  const d = digits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** Só aplica a máscara de CPF quando é só número (RG/passaporte com letras ficam como estão). */
export function maskDocument(value: string): string {
  return /[A-Za-z]/.test(value) ? value.toUpperCase().slice(0, 20) : maskCpf(value);
}

/** Dinheiro em reais: só dígitos, um separador decimal e no máximo 2 casas. */
export function maskMoney(value: string): string {
  return maskNumber(value, 2);
}

/** Número com casas decimais (vírgula ou ponto). */
export function maskNumber(value: string, decimals: number): string {
  const cleaned = value.replace(/[^\d.,]/g, "");
  // O último separador digitado é o decimal; os anteriores são milhar.
  const lastSep = Math.max(cleaned.lastIndexOf(","), cleaned.lastIndexOf("."));
  if (lastSep < 0 || decimals === 0) return digits(cleaned).slice(0, 12);
  const intPart = digits(cleaned.slice(0, lastSep)).slice(0, 12);
  const sep = cleaned[lastSep] === "." && cleaned.slice(lastSep + 1).length === 3 ? "" : ",";
  const decPart = digits(cleaned.slice(lastSep + 1));
  // "1.234" (ponto de milhar sem decimais) continua inteiro.
  if (!sep) return (intPart + decPart).slice(0, 12);
  return `${intPart}${sep}${decPart.slice(0, decimals)}`;
}

export function maskInteger(value: string): string {
  return digits(value).slice(0, 6);
}

/** UF: duas letras maiúsculas. */
export function maskUf(value: string): string {
  return value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2);
}

export function applyMask(kind: MaskKind, value: string): string {
  switch (kind) {
    case "phone":
      return maskPhone(value);
    case "cpf":
      return maskCpf(value);
    case "document":
      return maskDocument(value);
    case "money":
      return maskMoney(value);
    case "decimal":
      return maskNumber(value, 1);
    case "integer":
      return maskInteger(value);
    case "uf":
      return maskUf(value);
    case "time":
      return value;
  }
}

// ---- Validações instantâneas (mesmas regras do zod) --------------------------

const UFS = new Set(
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "),
);

export function phoneProblem(value: string): string | null {
  const d = digits(value);
  if (!d) return null;
  return d.length === 10 || d.length === 11 ? null : "Telefone com DDD, ex.: (11) 98765-4321";
}

export function documentProblem(value: string): string | null {
  const d = digits(value);
  if (!value.trim() || /[A-Za-z]/.test(value) || d.length !== 11) return null;
  return isValidCpf(d) ? null : "CPF inválido: confira os números";
}

export function emailProblem(value: string): string | null {
  if (!value.trim()) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? null : "E-mail inválido";
}

export function ufProblem(value: string): string | null {
  if (!value.trim()) return null;
  return UFS.has(value.trim().toUpperCase()) ? null : "UF inválida (ex.: SP, MG)";
}

export function moneyProblem(value: string, options: { required?: boolean; positive?: boolean } = {}): string | null {
  if (!value.trim()) return options.required ? "Informe o valor" : null;
  const number = Number(value.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(number)) return "Valor inválido";
  if (options.positive && number <= 0) return "Informe um valor maior que zero";
  return null;
}
