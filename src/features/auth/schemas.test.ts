import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./schemas";

describe("safeRedirectPath", () => {
  it("mantém caminhos internos", () => {
    expect(safeRedirectPath("/reservas/123?x=1")).toBe("/reservas/123?x=1");
  });

  it("volta para o início quando o destino é externo ou estranho", () => {
    for (const bad of [undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "evil.com"]) {
      expect(safeRedirectPath(bad)).toBe("/");
    }
  });
});
