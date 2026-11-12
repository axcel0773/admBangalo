import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist, type RuntimeCaching } from "serwist";

import { isCacheablePath } from "../lib/offline";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Leitura offline: telas e dados (RSC) já visitados ficam guardados por 7 dias.
 * Rede primeiro: com sinal, sempre a versão nova; sem sinal (ou lento, 4 s), a guardada.
 * Login, autenticação, API, iCal e recibos nunca entram no cache.
 */
const readCache: RuntimeCaching = {
  matcher: ({ request, sameOrigin, url }) =>
    sameOrigin && (request.mode === "navigate" || request.headers.get("RSC") === "1") && isCacheablePath(url.pathname),
  handler: new NetworkFirst({
    cacheName: "leitura-offline",
    networkTimeoutSeconds: 4,
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  }),
};

/**
 * Service worker do PWA:
 * - precache da casca do app (gerado no build);
 * - leitura offline (acima) e cache padrão do Serwist para arquivos estáticos;
 * - página /offline quando não há rede nem cache.
 * Gravações continuam exigindo conexão: nada é salvo offline.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [readCache, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
