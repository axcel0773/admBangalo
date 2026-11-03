"use client";

import { useId, type ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { inputClassName } from "./input-styles";

interface FieldProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
  hint?: string;
}

/** Input com label e mensagens de erro ligadas por aria-describedby. */
export function Field({ label, error, hint, id, className, ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(inputClassName, className)}
        {...props}
      />
      {message ? (
        <p
          id={messageId}
          className={cn("text-xs", error ? "font-semibold text-danger-ink" : "text-ink-muted")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
