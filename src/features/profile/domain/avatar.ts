export const AVATAR_BUCKET = "avatars";
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";
export const AVATAR_MAX_BYTES = 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Nome novo a cada troca: a URL muda e o navegador não mostra a foto antiga em cache. */
export function avatarPath(input: { ownerId: string; contentType: string; id: string }): string {
  return `${input.ownerId}/avatar-${input.id}.${EXTENSIONS[input.contentType] ?? "jpg"}`;
}

/** Só aceita caminhos da própria pasta do dono, no formato gerado por `avatarPath`. */
export function isOwnAvatarPath(path: string, ownerId: string): boolean {
  return new RegExp(`^${ownerId}/avatar-[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(path);
}

export function avatarProblem(file: { type: string; size: number }): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return "Use uma foto JPG, PNG ou WebP.";
  if (file.size > AVATAR_MAX_BYTES) return "A foto ficou grande demais. Tente outra.";
  return null;
}
