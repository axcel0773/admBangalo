import type { Tables } from "@/types/database";

type Charge = Tables<"reservation_charges">;
type FeeRow = Pick<Tables<"fees">, "kind" | "mode" | "amount" | "active" | "chalet_id">;

/** Tipos de taxa que dá para lançar à mão na reserva (energia tem cartão próprio). */
export const TAX_KINDS = ["cleaning", "pet", "other"] as const;
export type TaxKind = (typeof TAX_KINDS)[number];

export const TAX_KIND_LABELS: Record<TaxKind, string> = {
  cleaning: "Limpeza",
  pet: "Pet",
  other: "Outra",
};

/**
 * Separa a lista da reserva em taxas e itens quebrados/consumo.
 * Taxas de R$ 0,00 (sobras de taxa automática sem valor) não aparecem; a de energia
 * fica mesmo zerada, porque espera a leitura do medidor.
 */
export function groupCharges(charges: Charge[]): { taxes: Charge[]; items: Charge[] } {
  const visible = charges.filter((charge) => charge.mode === "metered" || charge.total !== 0);
  return {
    taxes: visible.filter((charge) => charge.kind !== "item"),
    items: visible.filter((charge) => charge.kind === "item"),
  };
}

/**
 * Valor sugerido para cada taxa, a partir das taxas cadastradas com valor fixo por estadia
 * (a do bangalô vence a geral). Sem cadastro, o campo vem vazio.
 */
export function taxDefaults(fees: FeeRow[], chaletId: string): Partial<Record<TaxKind, number>> {
  const defaults: Partial<Record<TaxKind, number>> = {};
  const usable = fees
    .filter((fee) => fee.active && fee.mode === "per_stay" && fee.amount > 0)
    .filter((fee) => fee.chalet_id === null || fee.chalet_id === chaletId)
    // Gerais primeiro; as do bangalô sobrescrevem.
    .sort((a, b) => Number(a.chalet_id !== null) - Number(b.chalet_id !== null));
  for (const fee of usable) {
    if ((TAX_KINDS as readonly string[]).includes(fee.kind)) defaults[fee.kind as TaxKind] = fee.amount;
  }
  return defaults;
}
