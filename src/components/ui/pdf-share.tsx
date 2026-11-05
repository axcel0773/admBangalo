"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

interface PdfShareProps {
  /** Nome do arquivo e título do compartilhamento. */
  fileName: string;
  title: string;
  /** Texto do WhatsApp (resumo do documento). */
  message: string;
  /** Link da conversa com o hóspede, com a mensagem pronta; null sem telefone. */
  whatsappHref: string | null;
  /** Gera o PDF (carregue o pdf-lib aqui dentro, com import dinâmico). */
  buildPdf: () => Promise<Uint8Array>;
  /** Frase mostrada se o PDF não puder ser gerado. */
  fallbackHint?: string;
}

type PdfState = { status: "loading" } | { status: "ready"; file: File } | { status: "error" };

/**
 * Envio de um documento em PDF (recibo, orçamento). O PDF é montado assim que a tela abre,
 * para o toque no botão chamar o compartilhamento na hora (celulares só abrem o menu de
 * compartilhar logo após um toque, sem esperar).
 * - Celular: abre o menu de compartilhar com o PDF anexado; é só escolher o WhatsApp e o hóspede.
 * - Computador: baixa o PDF; a mensagem sai pelo botão do WhatsApp e o arquivo é anexado na conversa.
 */
export function PdfShare({ fileName, title, message, whatsappHref, buildPdf, fallbackHint }: PdfShareProps) {
  const [pdf, setPdf] = useState<PdfState>({ status: "loading" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildPdf()
      .then((bytes) => {
        if (cancelled) return;
        setPdf({ status: "ready", file: new File([new Uint8Array(bytes)], fileName, { type: "application/pdf" }) });
      })
      .catch(() => {
        if (!cancelled) setPdf({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [buildPdf, fileName]);

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function share() {
    if (pdf.status !== "ready") return;
    const { file } = pdf;
    setNotice(null);

    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: message, title });
      } catch (error) {
        // Fechar o menu sem enviar não é erro.
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          download(file);
          setNotice("Não foi possível abrir o compartilhamento. O PDF foi baixado: anexe na conversa.");
        }
      }
      return;
    }

    download(file);
    setNotice("PDF baixado. Abra a conversa do hóspede e anexe o arquivo.");
  }

  const ready = pdf.status === "ready";

  return (
    <div className="flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-wrap justify-end gap-2">
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "soft", size: "sm" })}>
            <MessageCircle aria-hidden="true" />
            Mensagem
          </a>
        ) : null}
        <Button size="sm" variant="soft" onClick={share} disabled={!ready}>
          <Share2 aria-hidden="true" />
          {pdf.status === "loading" ? "Preparando PDF…" : "Enviar PDF"}
        </Button>
      </div>
      {pdf.status === "error" ? (
        <p role="alert" className="text-xs font-semibold text-danger-ink">
          Não foi possível gerar o PDF. {fallbackHint}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="max-w-xs text-right text-xs text-ink-muted">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
