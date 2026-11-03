import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "public/sw.js",
    "next-env.d.ts",
    "src/types/database.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    rules: {
      // Camadas: páginas e componentes não falam com o Supabase diretamente.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/supabase-js", "@supabase/ssr"],
              message: "Use os clientes de @/lib/supabase dentro de um repository.",
            },
          ],
        },
      ],
    },
  },
  {
    // e2e usa a API admin do Supabase local para criar a sessão de teste.
    files: ["src/lib/supabase/**", "src/middleware.ts", "src/proxy.ts", "e2e/**"],
    rules: { "no-restricted-imports": "off" },
  },
]);
