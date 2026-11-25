import { formatCurrency, pluralize } from "@/lib/format";

import { averageNightlyRate } from "./pricing";

/**
 * Como a hospedagem é cobrada: por diária (noites × diária) ou por pacote (valor fechado).
 * No pacote o hóspede vê só o total; a diária média fica gravada apenas como informação.
 */
export const PRICING_MODES = ["nightly", "package"] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

/** Nome usado quando o valor fechado é digitado sem escolher um pacote salvo. */
export const DEFAULT_PACKAGE_NAME = "Pacote fechado";

export interface LodgingPricing {
  nightly_rate: number;
  package_name: string | null;
  package_total: number | null;
}

/** Campos gravados na reserva/orçamento a partir do que foi escolhido na tela. */
export function resolveLodgingPricing(input: {
  mode: PricingMode;
  nights: number;
  nightlyRate?: number;
  packageName?: string | null;
  packageTotal?: number;
}): LodgingPricing {
  if (input.mode === "package") {
    const total = input.packageTotal ?? 0;
    return {
      nightly_rate: averageNightlyRate(total, input.nights),
      package_name: input.packageName?.trim() || DEFAULT_PACKAGE_NAME,
      package_total: total,
    };
  }
  return { nightly_rate: input.nightlyRate ?? 0, package_name: null, package_total: null };
}

interface LodgingDescriptionInput {
  nights: number;
  nightlyRate: number;
  packageName?: string | null;
}

/** "pacote Fim de semana" / "pacote fechado" (sem repetir a palavra pacote). */
function packageLabel(name: string): string {
  const trimmed = name.trim();
  return /^pacote\b/i.test(trimmed) ? `p${trimmed.slice(1)}` : `pacote ${trimmed}`;
}

/** "3 noites × R$ 350,00" ou "pacote Fim de semana (3 noites)". */
export function lodgingBasis({ nights, nightlyRate, packageName }: LodgingDescriptionInput): string {
  const nightsText = pluralize(nights, "noite", "noites");
  return packageName ? `${packageLabel(packageName)} (${nightsText})` : `${nightsText} × ${formatCurrency(nightlyRate)}`;
}

/** Linha do orçamento e do recibo: "Hospedagem: pacote Fim de semana (3 noites) − desconto R$ 50,00". */
export function lodgingLine(input: LodgingDescriptionInput & { discount: number }): string {
  return `Hospedagem: ${lodgingBasis(input)}` + (input.discount > 0 ? ` − desconto ${formatCurrency(input.discount)}` : "");
}
