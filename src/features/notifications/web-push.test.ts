import { createDecipheriv, createECDH, createPublicKey, hkdfSync, randomBytes, verify } from "node:crypto";
import { describe, expect, it } from "vitest";

import { encryptPayload, generateVapidKeys, sendPush, vapidAuthorization } from "./web-push";

/** Faz o papel do navegador: recebe o corpo criptografado e o decifra com a chave do aparelho. */
function decryptAsBrowser(body: Buffer, device: ReturnType<typeof createECDH>, authSecret: Buffer): string {
  const salt = body.subarray(0, 16);
  expect(body.readUInt32BE(16)).toBe(4096);
  const idLength = body[20] ?? 0;
  const serverPublic = body.subarray(21, 21 + idLength);
  const ciphertext = body.subarray(21 + idLength);

  const shared = device.computeSecret(serverPublic);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), device.getPublicKey(), serverPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", shared, authSecret, keyInfo, 32));
  const key = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));

  const decipher = createDecipheriv("aes-128-gcm", key, nonce);
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  const plain = Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
  expect(plain[plain.length - 1]).toBe(0x02);
  return plain.subarray(0, plain.length - 1).toString("utf8");
}

function newDevice() {
  const device = createECDH("prime256v1");
  device.generateKeys();
  const authSecret = randomBytes(16);
  return {
    device,
    authSecret,
    keys: { p256dh: device.getPublicKey().toString("base64url"), auth: authSecret.toString("base64url") },
  };
}

describe("web push", () => {
  it("o aparelho decifra o que o servidor cifrou", () => {
    const { device, authSecret, keys } = newDevice();
    const text = JSON.stringify({ title: "Bangalôs · hoje", body: "2 chegadas · 1 cobrança vencida (R$ 500,00)" });
    const body = encryptPayload(Buffer.from(text), keys);
    expect(decryptAsBrowser(body, device, authSecret)).toBe(text);
  });

  it("cada envio usa sal e chave novos", () => {
    const { keys } = newDevice();
    const a = encryptPayload(Buffer.from("oi"), keys);
    const b = encryptPayload(Buffer.from("oi"), keys);
    expect(a.equals(b)).toBe(false);
  });

  it("recusa chaves malformadas", () => {
    expect(() => encryptPayload(Buffer.from("x"), { p256dh: "abc", auth: "def" })).toThrow();
  });

  it("o cabeçalho VAPID traz um JWT ES256 verificável com a chave pública", () => {
    const { publicKey, privateKey } = generateVapidKeys();
    const header = vapidAuthorization("https://push.example.com/abc", { publicKey, privateKey, subject: "mailto:dono@example.com" }, 1_000);
    const match = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header);
    expect(match).not.toBeNull();
    const [, h, c, s, k] = match!;
    expect(k).toBe(publicKey);
    const claims = JSON.parse(Buffer.from(c!, "base64url").toString());
    expect(claims).toMatchObject({ aud: "https://push.example.com", sub: "mailto:dono@example.com", exp: 1_000 + 43_200 });

    const raw = Buffer.from(publicKey, "base64url");
    const key = createPublicKey({
      format: "jwk",
      key: { kty: "EC", crv: "P-256", x: raw.subarray(1, 33).toString("base64url"), y: raw.subarray(33, 65).toString("base64url") },
    });
    expect(verify("sha256", Buffer.from(`${h}.${c}`), { key, dsaEncoding: "ieee-p1363" }, Buffer.from(s!, "base64url"))).toBe(true);
  });

  it("traduz a resposta do serviço de push", async () => {
    const { keys } = newDevice();
    const vapid = { ...generateVapidKeys(), subject: "mailto:dono@example.com" };
    const subscription = { endpoint: "https://push.example.com/abc", ...keys };
    const reply = (status: number) => (async () => new Response(null, { status })) as unknown as typeof fetch;
    const message = { title: "t", body: "b" };
    expect(await sendPush(subscription, message, vapid, reply(201))).toBe("sent");
    expect(await sendPush(subscription, message, vapid, reply(410))).toBe("gone");
    expect(await sendPush(subscription, message, vapid, reply(404))).toBe("gone");
    expect(await sendPush(subscription, message, vapid, reply(500))).toBe("failed");
  });
});
