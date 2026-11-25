"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  /** Rótulo do grupo (visível acima das opções). */
  label: string;
  /** Nome do campo enviado no formulário. */
  name: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Escolha entre poucas opções lado a lado ("Por diária / Pacote fechado", "2x / 3x / 4x").
 * São rádios nativos: setas do teclado, leitor de tela e envio no formulário funcionam sem código extra.
 */
export function SegmentedControl<T extends string>({ label, name, options, value, onChange, className }: SegmentedControlProps<T>) {
  const labelId = useId();

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span id={labelId} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid gap-1 rounded-control bg-muted p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <label key={option.value} className="relative min-w-0 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-11 items-center justify-center rounded-[11px] px-2 text-center text-sm font-semibold text-ink-muted transition-colors peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
