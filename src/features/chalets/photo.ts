export const CHALET_PHOTO_BUCKET = "chalet-photos";
export const CHALET_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const CHALET_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Nome novo a cada troca: a URL muda e o navegador não mostra a foto antiga em cache. */
export function chaletPhotoPath(input: { ownerId: string; chaletId: string; contentType: string; id: string }): string {
  return `${input.ownerId}/${input.chaletId}/photo-${input.id}.${EXTENSIONS[input.contentType] ?? "jpg"}`;
}

/** Só aceita caminhos da pasta do próprio dono e deste bangalô, no formato de `chaletPhotoPath`. */
export function isOwnChaletPhotoPath(path: string, ownerId: string, chaletId: string): boolean {
  return new RegExp(`^${ownerId}/${chaletId}/photo-[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(path);
}

export function chaletPhotoProblem(file: { type: string; size: number }): string | null {
  if (!(TYPES as readonly string[]).includes(file.type)) return "Use uma foto JPG, PNG ou WebP.";
  if (file.size > CHALET_PHOTO_MAX_BYTES) return "A foto ficou grande demais. Tente outra.";
  return null;
}
