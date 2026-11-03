import { meteredConsumption, roundMoney } from "@/features/reservations/domain";
import { parseMoney } from "@/lib/money";

/** Cobrança de energia de uma reserva (a linha `metered` de reservation_charges). */
export interface EnergyChargeLike {
  kind: string;
  mode: string;
  meter_start: number | null;
  meter_end: number | null;
  unit_amount: number;
}

export function findEnergyCharge<T extends EnergyChargeLike>(charges: T[]): T | null {
  return (
    charges.find((charge) => charge.mode === "metered" && charge.kind === "energy") ??
    charges.find((charge) => charge.mode === "metered") ??
    null
  );
}

/** "12.345,6" ou "12345.6" → 12345.6 (o medidor tem uma casa decimal). */
export function parseReading(raw: string | null | undefined): number | null {
  const value = parseMoney(raw);
  if (value === null || value < 0) return null;
  return Math.round(value * 10) / 10;
}

export interface EnergyEstimate {
  consumption: number;
  total: number;
  /** As duas leituras estão preenchidas. */
  complete: boolean;
}

/** Prévia mostrada enquanto o proprietário digita a leitura. */
export function estimateEnergy(start: number | null, end: number | null, tariff: number): EnergyEstimate {
  if (start === null || end === null || end < start) {
    return { consumption: 0, total: 0, complete: false };
  }
  const consumption = meteredConsumption({ start, end });
  return { consumption, total: roundMoney(consumption * tariff), complete: true };
}

/** Qual leitura o proprietário deve anotar agora, conforme o status da reserva. */
export function pendingReading(
  status: string,
  reading: { start: number | null; end: number | null },
): "start" | "end" | null {
  if (status === "cancelled") return null;
  if (reading.start === null) return "start";
  if (reading.end === null && (status === "checked_in" || status === "checked_out")) return "end";
  return null;
}
