"use client";

import { Check, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface PixCopyProps {
  payload: string;
  /** Link do WhatsApp com a mensagem e o código, quando o hóspede tem telefone. */
  whatsappHref?: string | null;
  className?: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Navegadores antigos ou sem permissão: cópia pela seleção.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/** "Pix copia e cola" com o valor do saldo + envio pelo WhatsApp. */
export function PixCopy({ payload, whatsappHref, className }: PixCopyProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (await copyText(payload)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button variant="inverted" block onClick={handleCopy} aria-live="polite">
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? "Código copiado!" : "Copiar Pix copia e cola"}
      </Button>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "ghost", block: true }), "text-[#f5efe6] hover:bg-white/10")}
        >
          <MessageCircle aria-hidden="true" />
          Enviar cobrança no WhatsApp
        </a>
      ) : null}
    </div>
  );
}
