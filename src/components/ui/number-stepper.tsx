"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";

interface NumberStepperProps {
  name: string;
  label: string;
  description?: string;
  min?: number;
  max?: number;
  /** Modo controlado (o pai guarda o valor). */
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  className?: string;
}

/** Contador − / + com alvos de toque de 44 px; envia o valor num input oculto. */
export function NumberStepper({
  name,
  label,
  description,
  min = 0,
  max = 99,
  value,
  defaultValue = min,
  onChange,
  className,
}: NumberStepperProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  function update(next: number) {
    const clamped = Math.min(Math.max(next, min), max);
    if (value === undefined) setInternal(clamped);
    onChange?.(clamped);
  }

  return (
    <div className={cn("flex items-center justify-between gap-4 py-2.5", className)}>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {description ? <p className="text-xs text-ink-muted">{description}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          disabled={current <= min}
          onClick={() => update(current - 1)}
          className="flex size-11 items-center justify-center rounded-control border border-line-strong bg-surface text-ink disabled:opacity-40"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <output aria-live="polite" className="w-6 text-center text-lg font-bold">
          {current}
        </output>
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={current >= max}
          onClick={() => update(current + 1)}
          className="flex size-11 items-center justify-center rounded-control bg-primary text-on-primary disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      <input type="hidden" name={name} value={current} />
    </div>
  );
}
