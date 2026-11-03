import type { ChargeLine, FeeRule, MeterReading, StayContext } from "./types";

/**
 * Regras de preço espelhadas do banco (trigger apply_default_fees).
 * O banco é a fonte da verdade; aqui calculamos a prévia mostrada
 * na tela de nova reserva antes de salvar.
 */

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lodgingTotal(nights: number, nightlyRate: number, discount = 0): number {
  if (nights < 0) throw new RangeError("Número de noites não pode ser negativo");
  return roundMoney(nights * nightlyRate - discount);
}

/** Pessoas que passam dos hóspedes incluídos na diária. */
export function extraGuests({ guests, includedGuests }: StayContext): number {
  return Math.max(guests - includedGuests, 0);
}

/** Consumo do medidor; zero enquanto não houver as duas leituras. */
export function meteredConsumption({ start, end }: MeterReading): number {
  if (start === null || end === null) return 0;
  if (end < start) throw new RangeError("Leitura final menor que a inicial");
  return roundMoney(end - start);
}

/** Quantidade cobrada de uma taxa, conforme o modo de cobrança. */
export function chargeQuantity(fee: FeeRule, stay: StayContext, meter?: MeterReading): number {
  const people = fee.kind === "extra_guest" ? extraGuests(stay) : stay.guests;

  switch (fee.mode) {
    case "per_stay":
      return 1;
    case "per_night":
      return stay.nights;
    case "per_guest":
      return people;
    case "per_guest_night":
      return people * stay.nights;
    case "metered":
      return meter ? meteredConsumption(meter) : 0;
  }
}

/** Uma linha de cobrança, ou null quando a taxa não se aplica (ex.: sem pessoa extra). */
export function buildChargeLine(
  fee: FeeRule,
  stay: StayContext,
  meter?: MeterReading,
): ChargeLine | null {
  if (fee.kind === "extra_guest" && extraGuests(stay) === 0) return null;

  const quantity = chargeQuantity(fee, stay, meter);
  return {
    description: fee.name,
    kind: fee.kind,
    mode: fee.mode,
    unitAmount: fee.amount,
    quantity,
    total: roundMoney(fee.amount * quantity),
  };
}

export function buildChargeLines(fees: FeeRule[], stay: StayContext): ChargeLine[] {
  return fees
    .map((fee) => buildChargeLine(fee, stay))
    .filter((line): line is ChargeLine => line !== null);
}

export function sumCharges(lines: ChargeLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + line.total, 0));
}

export interface StayQuote {
  lodging: number;
  charges: ChargeLine[];
  chargesTotal: number;
  total: number;
}

/** Prévia completa: hospedagem + taxas automáticas. */
export function quoteStay(input: {
  stay: StayContext;
  nightlyRate: number;
  discount?: number;
  fees: FeeRule[];
}): StayQuote {
  const lodging = lodgingTotal(input.stay.nights, input.nightlyRate, input.discount);
  const charges = buildChargeLines(input.fees, input.stay);
  const chargesTotal = sumCharges(charges);
  return { lodging, charges, chargesTotal, total: roundMoney(lodging + chargesTotal) };
}
