import { describe, expect, it } from "vitest";

import { avatarPath, avatarProblem, isOwnAvatarPath } from "./avatar";

const OWNER = "11111111-1111-4111-8111-111111111111";
const ID = "22222222-2222-4222-8222-222222222222";

describe("avatar", () => {
  it("monta o caminho na pasta do dono", () => {
    expect(avatarPath({ ownerId: OWNER, contentType: "image/jpeg", id: ID })).toBe(`${OWNER}/avatar-${ID}.jpg`);
  });

  it("aceita só caminho da própria pasta", () => {
    expect(isOwnAvatarPath(`${OWNER}/avatar-${ID}.png`, OWNER)).toBe(true);
    expect(isOwnAvatarPath(`${ID}/avatar-${ID}.png`, OWNER)).toBe(false);
    expect(isOwnAvatarPath(`${OWNER}/../x/avatar-${ID}.png`, OWNER)).toBe(false);
    expect(isOwnAvatarPath(`${OWNER}/avatar-${ID}.exe`, OWNER)).toBe(false);
  });

  it("valida tipo e tamanho", () => {
    expect(avatarProblem({ type: "image/gif", size: 10 })).not.toBeNull();
    expect(avatarProblem({ type: "image/jpeg", size: 2_000_000 })).not.toBeNull();
    expect(avatarProblem({ type: "image/webp", size: 50_000 })).toBeNull();
  });
});
