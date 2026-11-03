import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import { securityHeaders } from "./src/lib/security-headers";

function baseConfig(development: boolean): NextConfig {
  return {
    reactStrictMode: true,
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: "/:path*",
          headers: securityHeaders({
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
            development,
            // Vercel sempre serve em HTTPS; localmente vale o NEXT_PUBLIC_SITE_URL.
            https: process.env.VERCEL === "1" || (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
          }),
        },
      ];
    },
  };
}

/**
 * PWA (Serwist) só entra fora do servidor de desenvolvimento.
 * - `next dev` usa Turbopack (padrão do Next 16) e roda sem service worker;
 * - `next build --webpack` gera o public/sw.js, pois o Serwist ainda depende do webpack.
 * A fase do Next é a forma confiável de distinguir os dois (o NODE_ENV ainda
 * não está definido quando este arquivo é carregado).
 */
export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) return baseConfig(true);

  const withSerwist = withSerwistInit({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    // Página exibida sem conexão; precisa estar no precache.
    additionalPrecacheEntries: [{ url: "/offline", revision: crypto.randomUUID() }],
  });

  return withSerwist(baseConfig(false));
}
