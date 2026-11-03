"use client";

import { useId, type ComponentProps } from "react";

import { cn } from "@/lib/cn";

interface SwitchFieldProps extends Omit<ComponentProps<"input">, "type"> {
  label: string;
  description?: string;
}

/** Checkbox com aparência de interruptor; envia "on" quando ligado. */
export function SwitchField({ label, description, id, className, ...props }: SwitchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-control bg-subtle px-4 py-3",
        className,
      )}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description ? <span className="block text-xs text-ink-muted">{description}</span> : null}
      </span>
      <input id={inputId} type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}
