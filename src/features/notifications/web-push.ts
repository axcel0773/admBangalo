import { createCipheriv, createECDH, createPrivateKey, hkdfSync, randomBytes, sign } from "node:crypto";

/**
 * Web Push sem dependências: VAPID (RFC 8292) + criptografia aes128gcm (RFC 8188/8291).
 * Só usa o módulo `crypto` do Node. A chave privada VAPID nunca sai do servidor.
 */

const b64u = (buffer: Buffer | Uint8Array) => Buffer.from(buffer).toString("base64url");
const fromB64u = (text: string) => Buffer.from(text, "base64url");

export interface PushSubscriptionKeys {
  endpoint: string;
  /** Chave pública do aparelho (65 bytes, base64url). */
  p256dh: string;
  /** Segredo de autenticação (16 bytes, base64url). */
  auth: string;
}

export interface VapidKeys {
  /** 65 bytes não comprimidos, base64url (vai para o navegador e para o cabeçalho). */
  publicKey: string;
  /** 32 bytes, base64url. */
  privateKey: string;
  /** "mailto:..." ou URL do responsável pelo envio. */
  subject: string;
}

/** Gera um par VAPID novo (uso: script de configuração; não é chamado pelo app). */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return { publicKey: b64u(ecdh.getPublicKey()), privateKey: b64u(ecdh.getPrivateKey()) };
}

/** Cabeçalho `Authorization` VAPID para o serviço de push do `endpoint`. */
export function vapidAuthorization(endpoint: string, vapid: VapidKeys, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const audience = new URL(endpoint).origin;
  const header = b64u(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(Buffer.from(JSON.stringify({ aud: audience, exp: nowSeconds + 12 * 60 * 60, sub: vapid.subject })));
  const unsigned = `${header}.${claims}`;

  const publicKey = fromB64u(vapid.publicKey);
  const key = createPrivateKey({
    format: "jwk",
    key: {
      kty: "EC",
      crv: "P-256",
      d: vapid.privateKey,
      x: b64u(publicKey.subarray(1, 33)),
      y: b64u(publicKey.subarray(33, 65)),
    },
  });
  const signature = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${unsigned}.${b64u(signature)}, k=${vapid.publicKey}`;
}

/** Criptografa a mensagem para o aparelho (corpo `aes128gcm` de um único registro). */
export function encryptPayload(
  payload: Buffer,
  keys: Pick<PushSubscriptionKeys, "p256dh" | "auth">,
  random: { salt?: Buffer; ephemeral?: ReturnType<typeof createECDH> } = {},
): Buffer {
  const userPublic = fromB64u(keys.p256dh);
  const authSecret = fromB64u(keys.auth);
  if (userPublic.length !== 65 || userPublic[0] !== 0x04) throw new Error("Chave p256dh inválida");
  if (authSecret.length !== 16) throw new Error("Segredo auth inválido");

  const ephemeral = random.ephemeral ?? createECDH("prime256v1");
  if (!random.ephemeral) ephemeral.generateKeys();
  const serverPublic = ephemeral.getPublicKey();
  const salt = random.salt ?? randomBytes(16);
  const shared = ephemeral.computeSecret(userPublic);

  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), userPublic, serverPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", shared, authSecret, keyInfo, 32));
  const contentKey = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));

  // 0x02 marca o último (e único) registro.
  const plaintext = Buffer.concat([payload, Buffer.from([0x02])]);
  const cipher = createCipheriv("aes-128-gcm", contentKey, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  return Buffer.concat([salt, recordSize, Buffer.from([serverPublic.length]), serverPublic, encrypted]);
}

export type PushResult = "sent" | "gone" | "failed";

/** Envia uma notificação. "gone" = o aparelho não existe mais (404/410): apague a inscrição. */
export async function sendPush(
  subscription: PushSubscriptionKeys,
  message: { title: string; body: string; url?: string },
  vapid: VapidKeys,
  fetcher: typeof fetch = fetch,
): Promise<PushResult> {
  const body = encryptPayload(Buffer.from(JSON.stringify(message)), subscription);
  const response = await fetcher(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidAuthorization(subscription.endpoint, vapid),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(24 * 60 * 60),
      Urgency: "normal",
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404 || response.status === 410) return "gone";
  return response.ok ? "sent" : "failed";
}
