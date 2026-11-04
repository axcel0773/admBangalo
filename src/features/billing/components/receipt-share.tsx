"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

import { receiptFileName, type ReceiptData } from "../domain/receipt";

interface ReceiptShareProps {
  data: ReceiptData;
  /** Texto do WhatsApp (resumo do recibo). */
  message: string;
  /** Link da conversa com o hóspede, com a mensagem pronta; null sem telefone. */
  whatsappHref: string | null;
}

type PdfState = { status: "loading" } | { status: "ready"; file: File } | { status: "error" };

/**
 * Envio do recibo. O PDF é montado assim que a tela abre, para o toque no botão
 * chamar o compartilhamento na hora (celulares só abrem o menu de compartilhar
 * logo após um toque, sem esperar).
 * - Celular: abre o menu de compartilhar com o PDF anexado; é só escolher o WhatsApp e o hóspede.
 * - Computador: baixa o PDF; a mensagem sai pelo botão do WhatsApp e o arquivo é anexado na conversa.
 */
export function ReceiptShare({ data, message, whatsappHref }: ReceiptShareProps) {
  const [pdf, setPdf] = useState<PdfState>({ status: "loading" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // pdf-lib só carrega aqui (cerca de 400 KB), não pesa no resto do app.
    import("../pdf/receipt-pdf")
      .then(({ buildReceiptPdf }) => buildReceiptPdf(data))
      .then((bytes) => {
        if (cancelled) return;
        const file = new File([new Uint8Array(bytes)], receiptFileName(data), { type: "application/pdf" });
        setPdf({ status: "ready", file });
      })
      .catch(() => {
        if (!cancelled) setPdf({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

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
        await navigator.share({ files: [file], text: message, title: `Recibo ${data.number}` });
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
          Não foi possível gerar o PDF. Use “Imprimir ou PDF”.
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
