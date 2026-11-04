import { formatCurrency } from "@/lib/format";
import type { Enums, Tables } from "@/types/database";

export type Fee = Tables<"fees">;
export type FeeKind = Enums<"fee_kind">;
export type ChargeMode = Enums<"charge_mode">;

export const FEE_KIND_LABELS: Record<FeeKind, string> = {
  cleaning: "Limpeza",
  energy: "Energia",
  extra_guest: "Pessoa extra (desativada)",
  pet: "Pet",
  other: "Outra",
};

export const CHARGE_MODE_LABELS: Record<ChargeMode, string> = {
  per_stay: "Valor fixo por estadia",
  per_night: "Por diária",
  per_guest: "Por pessoa",
  per_guest_night: "Por pessoa, por diária",
  metered: "Medida (leitura do medidor)",
};

const UNIT_SUFFIX: Record<ChargeMode, string> = {
  per_stay: "por estadia",
  per_night: "por noite",
  per_guest: "por pessoa",
  per_guest_night: "por pessoa/noite",
  metered: "por kWh",
};

/** "R$ 150,00 por estadia" */
export function describeFeeAmount(fee: Pick<Fee, "amount" | "mode">): string {
  return `${formatCurrency(fee.amount)} ${UNIT_SUFFIX[fee.mode]}`;
}

export function toOptions<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
