"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { inputClassName } from "./input-styles";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<ComponentProps<"select">, "children"> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  /** Primeira opção vazia (ex.: "Todos os chalés"). */
  placeholder?: string;
}

export function SelectField({
  label,
  options,
  error,
  hint,
  placeholder,
  id,
  className,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(inputClassName, "appearance-none pr-10", className)}
          {...props}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-muted"
        />
      </div>
      {message ? (
        <p id={messageId} className={cn("text-xs", error ? "font-semibold text-danger-ink" : "text-ink-muted")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
