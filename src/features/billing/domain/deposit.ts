import { roundMoney } from "@/features/reservations/domain";

/** Sinal padrão para quem ainda não configurou o perfil. */
export const DEFAULT_DEPOSIT_PERCENT = 30;

/** Percentual válido (0–100, inteiro); qualquer outra coisa volta ao padrão. */
export function normalizeDepositPercent(value: number | null | undefined): number {
  if (value === null || value === undefined || !Number.isInteger(value) || value < 0 || value > 100) {
    return DEFAULT_DEPOSIT_PERCENT;
  }
  return value;
}

/** Valor do sinal: percentual do total, em centavos, nunca acima do total. 0% = sem sinal. */
export function suggestedDeposit(total: number, percent: number): number {
  if (!(total > 0) || !(percent > 0)) return 0;
  return Math.min(roundMoney((total * Math.min(percent, 100)) / 100), roundMoney(total));
}
