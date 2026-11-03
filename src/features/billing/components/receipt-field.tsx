"use client";

import { CircleCheck, Paperclip } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/cn";
import { shrinkImage } from "@/lib/images";
import { uploadToBucket } from "@/lib/supabase/storage";

import { RECEIPT_ACCEPT, receiptPath, receiptProblem } from "../domain/receipts";

type UploadState =
  | { status: "empty" }
  | { status: "uploading"; name: string }
  | { status: "done"; name: string; path: string }
  | { status: "error"; message: string };

interface ReceiptFieldProps {
  ownerId: string;
  reservationId: string;
  /** Avisa o formulário para segurar o envio enquanto o arquivo sobe. */
  onUploadingChange: (uploading: boolean) => void;
}

/**
 * Comprovante opcional. O arquivo sobe direto para o Storage assim que é escolhido
 * (fotos são reduzidas antes); o formulário só envia o caminho em `receipt_path`.
 */
export function ReceiptField({ ownerId, reservationId, onUploadingChange }: ReceiptFieldProps) {
  const inputId = useId();
  const [upload, setUpload] = useState<UploadState>({ status: "empty" });

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const typeProblem = receiptProblem({ type: file.type, size: 0 });
    if (typeProblem) return setUpload({ status: "error", message: typeProblem });

    setUpload({ status: "uploading", name: file.name });
    onUploadingChange(true);
    try {
      const { blob, type } = await shrinkImage(file);
      const problem = receiptProblem({ type, size: blob.size });
      if (problem) {
        setUpload({ status: "error", message: problem });
        return;
      }
      const path = receiptPath({ ownerId, reservationId, contentType: type, id: crypto.randomUUID() });
      await uploadToBucket({ bucket: "receipts", path, file: blob, contentType: type });
      setUpload({ status: "done", name: file.name, path });
    } catch (error) {
      setUpload({ status: "error", message: error instanceof Error ? error.message : "Falha no envio." });
    } finally {
      onUploadingChange(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">Comprovante (opcional)</span>
      <label
        htmlFor={inputId}
        className={cn(
          "flex min-h-12 cursor-pointer items-center gap-2 rounded-control border border-dashed border-line-strong bg-surface px-4 text-sm",
          upload.status === "done" ? "text-primary-ink" : "text-ink-soft",
        )}
      >
        {upload.status === "done" ? (
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Paperclip className="size-4 shrink-0" aria-hidden="true" />
        )}
        <span className="truncate">
          {upload.status === "empty" && "Foto ou PDF do comprovante"}
          {upload.status === "uploading" && `Enviando ${upload.name}…`}
          {upload.status === "done" && `${upload.name} anexado`}
          {upload.status === "error" && "Escolher outro arquivo"}
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        accept={RECEIPT_ACCEPT}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <input type="hidden" name="receipt_path" value={upload.status === "done" ? upload.path : ""} />
      {upload.status === "error" ? (
        <p role="alert" className="text-xs font-semibold text-danger-ink">
          {upload.message}
        </p>
      ) : null}
    </div>
  );
}
