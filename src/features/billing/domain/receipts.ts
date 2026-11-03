/**
 * Comprovantes de pagamento no bucket privado "receipts".
 * Caminho: <owner_id>/<reservation_id>/<arquivo> — a política do Storage
 * só deixa cada dono mexer na própria pasta.
 */

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const RECEIPT_ACCEPT = Object.keys(EXTENSIONS).join(",");

/** Problema com o arquivo escolhido, ou null se pode enviar. */
export function receiptProblem(file: { type: string; size: number }): string | null {
  if (!EXTENSIONS[file.type]) return "Envie uma foto (JPG, PNG, WEBP) ou um PDF.";
  if (file.size > RECEIPT_MAX_BYTES) return "O arquivo passa de 5 MB.";
  return null;
}

export function receiptPath(input: { ownerId: string; reservationId: string; contentType: string; id: string }): string {
  const extension = EXTENSIONS[input.contentType] ?? "bin";
  return `${input.ownerId}/${input.reservationId}/${input.id}.${extension}`;
}

/** O caminho enviado pelo navegador é mesmo da pasta deste dono e desta reserva? */
export function isOwnReceiptPath(path: string, ownerId: string, reservationId: string): boolean {
  const prefix = `${ownerId}/${reservationId}/`;
  return path.startsWith(prefix) && /^[\w-]+\.(jpg|png|webp|pdf)$/.test(path.slice(prefix.length));
}
