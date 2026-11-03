"use client";

import { MailCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

import { signIn } from "../actions";
import { initialAuthState } from "../schemas";

type Mode = "password" | "magic-link";

interface LoginFormProps {
  next?: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>("password");
  const [state, formAction, pending] = useActionState(signIn, initialAuthState);

  if (state.status === "link-sent") {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="font-display text-xl font-semibold">Confira seu e-mail</h2>
        <p className="text-sm text-ink-muted">
          Enviamos um link de acesso para <b className="text-ink">{state.email}</b>.
        </p>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? "/"} />
      <input type="hidden" name="mode" value={mode} />

      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        error={fieldErrors?.email}
      />

      {mode === "password" ? (
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={fieldErrors?.password}
        />
      ) : null}

      {state.status === "error" && !fieldErrors?.email && !fieldErrors?.password ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-ink">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Aguarde…" : mode === "password" ? "Entrar" : "Enviar link de acesso"}
      </Button>

      <Button
        variant="ghost"
        block
        onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
      >
        {mode === "password" ? "Prefiro receber um link por e-mail" : "Entrar com senha"}
      </Button>
    </form>
  );
}
