"use client";

import { useCallback } from "react";

import { PdfShare } from "@/components/ui/pdf-share";

import { receiptFileName, type ReceiptData } from "../domain/receipt";

interface ReceiptShareProps {
  data: ReceiptData;
  /** Texto do WhatsApp (resumo do recibo). */
  message: string;
  /** Link da conversa com o hóspede, com a mensagem pronta; null sem telefone. */
  whatsappHref: string | null;
}

/** Envio do recibo em PDF (WhatsApp / compartilhar / baixar). */
export function ReceiptShare({ data, message, whatsappHref }: ReceiptShareProps) {
  // pdf-lib só carrega aqui (cerca de 400 KB), não pesa no resto do app.
  const buildPdf = useCallback(async () => {
    const { buildReceiptPdf } = await import("../pdf/receipt-pdf");
    return buildReceiptPdf(data);
  }, [data]);

  return (
    <PdfShare
      fileName={receiptFileName(data)}
      title={`Recibo ${data.number}`}
      message={message}
      whatsappHref={whatsappHref}
      buildPdf={buildPdf}
      fallbackHint="Use “Imprimir ou PDF”."
    />
  );
}
