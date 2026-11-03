"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "./button";

interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  pendingLabel?: string;
}

/** Botão de envio que se desabilita sozinho enquanto a Server Action roda. */
export function SubmitButton({ children, pendingLabel = "Salvando…", disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending || undefined} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
