// Gera um par de chaves VAPID para as notificações push. Uso: node scripts/gerar-vapid.mjs
// A chave privada vai só para a variável VAPID_PRIVATE_KEY na Vercel; nunca para o repositório.
import { createECDH } from "node:crypto";

const ecdh = createECDH("prime256v1");
ecdh.generateKeys();
console.log(`VAPID_PUBLIC_KEY=${ecdh.getPublicKey().toString("base64url")}`);
console.log(`VAPID_PRIVATE_KEY=${ecdh.getPrivateKey().toString("base64url")}`);
