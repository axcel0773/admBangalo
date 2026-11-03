"use client";

import { Check, Copy } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/cn";

import { Button } from "./button";
import { inputClassName } from "./input-styles";

/** Texto somente leitura com botão de copiar (links, códigos). */
export function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const id = useId();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      (document.getElementById(id) as HTMLInputElement | null)?.select();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      <div className="flex gap-2">
        <input id={id} readOnly value={value} className={cn(inputClassName, "min-w-0 flex-1 font-mono text-xs")} onFocus={(e) => e.target.select()} />
        <Button variant="secondary" size="icon" onClick={copy} aria-label={copied ? "Copiado" : `Copiar ${label}`}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
      </div>
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}
