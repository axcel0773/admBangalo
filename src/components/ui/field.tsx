"use client";

import { useId, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { cn } from "@/lib/cn";
import { applyMask, type MaskKind } from "@/lib/masks";

import { inputClassName } from "./input-styles";

interface FieldProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
  hint?: string;
  /** Formata enquanto digita (telefone, CPF, dinheiro…). */
  mask?: MaskKind;
  /** Validação instantânea ao sair do campo; o servidor valida de novo. */
  validate?: (value: string) => string | null;
}

/** Input com label e mensagens de erro ligadas por aria-describedby. */
export function Field({
  label,
  error,
  hint,
  id,
  className,
  mask,
  validate,
  onChange,
  onBlur,
  defaultValue,
  required,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const [localError, setLocalError] = useState<string | null>(null);

  const shownError = error ?? localError ?? undefined;
  const message = shownError ?? hint;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (mask) {
      const masked = applyMask(mask, event.target.value);
      if (masked !== event.target.value) event.target.value = masked;
    }
    if (localError) setLocalError(null);
    onChange?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (required && !value.trim()) setLocalError(`${label.replace(/\s*\(.*\)$/, "")} é obrigatório`);
    else if (validate) setLocalError(validate(value));
    onBlur?.(event);
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-semibold text-ink-soft">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-accent-ink">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <input
        id={inputId}
        aria-invalid={shownError ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        aria-required={required || undefined}
        className={cn(inputClassName, "min-w-0", className)}
        defaultValue={mask && typeof defaultValue === "string" ? applyMask(mask, defaultValue) : defaultValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
      {message ? (
        <p
          id={messageId}
          role={shownError ? "alert" : undefined}
          className={cn("text-xs", shownError ? "font-semibold text-danger-ink" : "text-ink-muted")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
