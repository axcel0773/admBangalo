/**
 * Reduz fotos antes do envio (celular gera 3–8 MB por foto).
 * Só roda no navegador; se algo falhar, devolve o arquivo original.
 */
export async function shrinkImage(
  file: File,
  options: { maxSide?: number; quality?: number } = {},
): Promise<{ blob: Blob; type: string }> {
  const maxSide = options.maxSide ?? 1600;
  const quality = options.quality ?? 0.8;
  if (!file.type.startsWith("image/")) return { blob: file, type: file.type };

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return { blob: file, type: file.type };
    return { blob, type: "image/jpeg" };
  } catch {
    return { blob: file, type: file.type };
  }
}
