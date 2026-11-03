import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "./security-headers";

const SUPABASE = "https://abcd.supabase.co";

function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp.split("; ").map((part) => {
      const [name = "", ...values] = part.split(" ");
      return [name, values];
    }),
  );
}

describe("cabeçalhos de segurança", () => {
  it("libera só o próprio site e o Supabase", () => {
    const csp = directives(contentSecurityPolicy({ supabaseUrl: SUPABASE, development: false, https: true }));
    expect(csp.get("default-src")).toEqual(["'self'"]);
    expect(csp.get("connect-src")).toEqual(["'self'", SUPABASE, "wss://abcd.supabase.co"]);
    expect(csp.get("img-src")).toContain(SUPABASE);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.has("upgrade-insecure-requests")).toBe(true);
  });

  it("produção não tem unsafe-eval; desenvolvimento tem (HMR)", () => {
    expect(contentSecurityPolicy({ supabaseUrl: SUPABASE, development: false, https: true })).not.toContain("unsafe-eval");
    const dev = directives(contentSecurityPolicy({ supabaseUrl: SUPABASE, development: true, https: false }));
    expect(dev.get("script-src")).toContain("'unsafe-eval'");
    expect(dev.get("connect-src")).toContain("ws:");
    expect(dev.has("upgrade-insecure-requests")).toBe(false);
  });

  it("URL inválida do Supabase não quebra a política", () => {
    const csp = directives(contentSecurityPolicy({ supabaseUrl: "", development: false, https: true }));
    expect(csp.get("connect-src")).toEqual(["'self'"]);
  });

  it("HSTS só com HTTPS (localhost em http continua funcionando); anti-clickjacking sempre", () => {
    const prod = securityHeaders({ supabaseUrl: SUPABASE, development: false, https: true }).map((h) => h.key);
    const local = securityHeaders({ supabaseUrl: SUPABASE, development: false, https: false });
    expect(prod).toContain("Strict-Transport-Security");
    expect(local.map((h) => h.key)).not.toContain("Strict-Transport-Security");
    expect(local.find((h) => h.key === "Content-Security-Policy")?.value).not.toContain("upgrade-insecure-requests");
    expect(local.map((h) => h.key)).toContain("X-Frame-Options");
  });
});
