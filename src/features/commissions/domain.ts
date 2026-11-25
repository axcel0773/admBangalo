import type { Enums, Tables } from "@/types/database";

/** Comissão do corretor que trouxe o hóspede (no máximo uma por reserva). */
export interface Commission {
  brokerName: string;
  amount: number;
  /** Data em que foi paga; vazio = a pagar. */
  paidOn: string | null;
  method: Enums<"payment_method"> | null;
}

export type CommissionColumns = Pick<
  Tables<"reservations">,
  "broker_name" | "commission_amount" | "commission_paid_on" | "commission_method"
>;

/** Atalhos de porcentagem oferecidos ao digitar a comissão. */
export const COMMISSION_PERCENTS = [5, 10, 15] as const;

export function commissionOf(row: CommissionColumns): Commission | null {
  if (!row.broker_name || row.commission_amount === null) return null;
  return {
    brokerName: row.broker_name,
    amount: row.commission_amount,
    paidOn: row.commission_paid_on,
    method: row.commission_method,
  };
}

/** Valor da comissão para `percent`% do total, em reais inteiros (sem centavos quebrados). */
export function commissionForPercent(total: number, percent: number): number {
  if (!(total > 0) || !(percent > 0)) return 0;
  return Math.round((total * percent) / 100);
}

/** "10% do total", "7,5% do total"; nada quando não há total para comparar. */
export function describeCommissionShare(amount: number, total: number): string | null {
  if (!(total > 0) || !(amount > 0)) return null;
  const percent = Math.round((amount / total) * 1000) / 10;
  return `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total`;
}

/** Nomes de corretores já usados, sem repetir (ignora maiúsculas e espaços), em ordem alfabética. */
export function uniqueBrokerNames(names: (string | null)[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of names) {
    const name = raw?.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase("pt-BR");
    if (!seen.has(key)) seen.set(key, name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Soma das comissões (em centavos certos). */
export function totalCommissions(rows: { commission_amount: number | null }[]): number {
  const cents = rows.reduce((sum, row) => sum + Math.round((row.commission_amount ?? 0) * 100), 0);
  return cents / 100;
}
