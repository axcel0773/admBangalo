import { cn } from "@/lib/cn";
import { formatCurrency, formatCurrencyRounded } from "@/lib/format";

interface MoneyProps {
  value: number;
  /** Sem centavos (cartões e resumos). */
  rounded?: boolean;
  tone?: "default" | "positive" | "pending";
  className?: string;
}

const toneClass = {
  default: "",
  positive: "text-primary-ink",
  pending: "text-accent-ink",
} as const;

export function Money({ value, rounded = false, tone = "default", className }: MoneyProps) {
  return (
    <span className={cn("tabular-nums", toneClass[tone], className)}>
      {rounded ? formatCurrencyRounded(value) : formatCurrency(value)}
    </span>
  );
}
