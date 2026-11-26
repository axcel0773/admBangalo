import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { formatCurrency, formatCurrencyRounded } from "@/lib/format";

interface MoneyProps {
  value: number;
  /**
   * Para cartões e resumos: centavos em letra menor e só quando existem
   * ("R$ 18.430" e, com centavos, "R$ 18.430,02"). Assim o resumo bate com o detalhe.
   */
  rounded?: boolean;
  /** Só reais inteiros (médias e totais anuais, onde o centavo não importa e falta espaço). */
  whole?: boolean;
  tone?: "default" | "positive" | "pending";
  className?: string;
}

const toneClass = {
  default: "",
  positive: "text-primary-ink",
  pending: "text-accent-ink",
} as const;

/** "R$ 18.430,02" → ["R$ 18.430", ",02"]; sem centavos, o segundo vem vazio. */
export function splitCents(value: number): [string, string] {
  const full = formatCurrency(value);
  const comma = full.lastIndexOf(",");
  if (comma < 0) return [full, ""];
  const cents = full.slice(comma);
  return [full.slice(0, comma), cents === ",00" ? "" : cents];
}

export function Money({ value, rounded = false, whole = false, tone = "default", className }: MoneyProps) {
  let content: ReactNode;
  if (whole) content = formatCurrencyRounded(value);
  else if (rounded) {
    const [main, cents] = splitCents(value);
    content = cents ? (
      <>
        {main}
        <span className="text-[0.6em]">{cents}</span>
      </>
    ) : (
      main
    );
  } else content = formatCurrency(value);

  return <span className={cn("tabular-nums", toneClass[tone], className)}>{content}</span>;
}
