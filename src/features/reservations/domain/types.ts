import type { Enums } from "@/types/database";

export type ChargeMode = Enums<"charge_mode">;
export type FeeKind = Enums<"fee_kind">;
export type ReservationStatus = Enums<"reservation_status">;
export type PaymentKind = Enums<"payment_kind">;
export type PaymentStatus = "cancelled" | "unpaid" | "partial" | "paid";

/** Modelo de taxa configurado pelo proprietário. */
export interface FeeRule {
  name: string;
  kind: FeeKind;
  mode: ChargeMode;
  amount: number;
}

/** O que a regra de cobrança precisa saber da estadia. */
export interface StayContext {
  nights: number;
  guests: number;
  /** Hóspedes já incluídos na diária do chalé. */
  includedGuests: number;
}

export interface ChargeLine {
  description: string;
  kind: FeeKind;
  mode: ChargeMode;
  unitAmount: number;
  quantity: number;
  total: number;
}

export interface MeterReading {
  start: number | null;
  end: number | null;
}

export interface PaymentEntry {
  kind: PaymentKind;
  amount: number;
}
