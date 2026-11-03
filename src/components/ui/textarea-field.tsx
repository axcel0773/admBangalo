"use client";

import { useId, type ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { inputClassName } from "./input-styles";

interface TextareaFieldProps extends ComponentProps<"textarea"> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextareaField({ label, error, hint, id, className, rows = 3, ...props }: TextareaFieldProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const messageId = `${textareaId}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(inputClassName, "h-auto py-3 leading-relaxed", className)}
        {...props}
      />
      {message ? (
        <p id={messageId} className={cn("text-xs", error ? "font-semibold text-danger-ink" : "text-ink-muted")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
