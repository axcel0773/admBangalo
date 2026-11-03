import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/** Guarda de segurança: a chave secreta do Supabase nunca pode entrar no código do app. */
const SRC = join(process.cwd(), "src");
const FORBIDDEN = [/service_role/i, /SERVICE_ROLE_KEY/, /sb_secret_[A-Za-z0-9]/, /SUPABASE_SECRET/];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("segredos fora do app", () => {
  it("nenhum arquivo de src/ menciona a chave service_role ou secreta", () => {
    const offenders = sourceFiles(SRC).filter((file) => {
      const code = readFileSync(file, "utf8");
      return FORBIDDEN.some((pattern) => pattern.test(code));
    });
    expect(offenders.map((file) => relative(process.cwd(), file))).toEqual([]);
  });
});
