import { cn } from "@/lib/cn";

interface StepIndicatorProps {
  steps: string[];
  /** Índice da etapa atual (0 = primeira). */
  current: number;
  className?: string;
}

/** Barra de progresso em etapas ("1 · Estadia", "2 · Hóspedes"…). */
export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <ol
      aria-label={`Etapa ${current + 1} de ${steps.length}`}
      className={cn("grid gap-1.5 text-[11px] font-semibold", className)}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((label, index) => (
        <li
          key={label}
          aria-current={index === current ? "step" : undefined}
          className={cn("flex flex-col gap-1.5", index <= current ? "text-primary-ink" : "text-ink-muted")}
        >
          <span className={cn("h-1.5 rounded-full", index <= current ? "bg-primary" : "bg-line-strong")} />
          {index + 1} · {label}
        </li>
      ))}
    </ol>
  );
}
