"use client";

import { useCallback } from "react";

import { PdfShare } from "@/components/ui/pdf-share";

import { quoteFileName, type QuoteDocument } from "../domain/quote-document";

interface QuoteShareProps {
  data: QuoteDocument;
  message: string;
  whatsappHref: string | null;
}

/** Envio do orçamento em PDF (WhatsApp / compartilhar / baixar). */
export function QuoteShare({ data, message, whatsappHref }: QuoteShareProps) {
  const buildPdf = useCallback(async () => {
    const { buildQuotePdf } = await import("../pdf/quote-pdf");
    return buildQuotePdf(data);
  }, [data]);

  return (
    <PdfShare
      fileName={quoteFileName(data)}
      title={`Orçamento ${data.number}`}
      message={message}
      whatsappHref={whatsappHref}
      buildPdf={buildPdf}
    />
  );
}
