import { describe, expect, it } from "vitest";

import { chaletPhotoPath, chaletPhotoProblem, isOwnChaletPhotoPath } from "./photo";

const OWNER = "11111111-1111-4111-8111-111111111111";
const CHALET = "33333333-3333-4333-8333-333333333333";
const ID = "22222222-2222-4222-8222-222222222222";

describe("foto do bangalô", () => {
  it("monta o caminho na pasta do dono e do bangalô", () => {
    expect(chaletPhotoPath({ ownerId: OWNER, chaletId: CHALET, contentType: "image/webp", id: ID })).toBe(
      `${OWNER}/${CHALET}/photo-${ID}.webp`,
    );
  });

  it("aceita só caminho do próprio dono e bangalô", () => {
    expect(isOwnChaletPhotoPath(`${OWNER}/${CHALET}/photo-${ID}.jpg`, OWNER, CHALET)).toBe(true);
    expect(isOwnChaletPhotoPath(`${ID}/${CHALET}/photo-${ID}.jpg`, OWNER, CHALET)).toBe(false);
    expect(isOwnChaletPhotoPath(`${OWNER}/${ID}/photo-${ID}.jpg`, OWNER, CHALET)).toBe(false);
    expect(isOwnChaletPhotoPath(`${OWNER}/${CHALET}/../photo-${ID}.jpg`, OWNER, CHALET)).toBe(false);
  });

  it("valida tipo e tamanho", () => {
    expect(chaletPhotoProblem({ type: "image/gif", size: 1 })).not.toBeNull();
    expect(chaletPhotoProblem({ type: "image/jpeg", size: 3_000_000 })).not.toBeNull();
    expect(chaletPhotoProblem({ type: "image/jpeg", size: 200_000 })).toBeNull();
  });
});
