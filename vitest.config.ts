import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Domínio roda em node; componentes pedem jsdom no topo do arquivo (@vitest-environment jsdom).
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Valores de mentira: alguns componentes importam o cliente do Supabase.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html"],
      // Meta da etapa 5: regras de negócio (domínio) com ≥ 90% de linhas cobertas.
      include: [
        "src/features/*/domain.ts",
        "src/features/*/domain/**/*.ts",
        "src/lib/money.ts",
        "src/lib/validation.ts",
        "src/lib/dates.ts",
        "src/lib/security-headers.ts",
      ],
      exclude: ["**/*.test.*", "**/index.ts", "**/types.ts"],
      thresholds: { lines: 90, statements: 90, functions: 85, branches: 80 },
    },
  },
});
