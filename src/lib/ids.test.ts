import { describe, expect, it } from "vitest";

import { assertIds, isUuid } from "./ids";

describe("isUuid", () => {
  it("aceita UUIDs", () => {
    expect(isUuid("bbbbbbbb-0000-4000-8000-000000000001")).toBe(true);
  });

  it("recusa texto, injeção e outros tipos", () => {
    expect(isUuid("1")).toBe(false);
    expect(isUuid("bbbbbbbb-0000-4000-8000-000000000001,id.neq.null")).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(42)).toBe(false);
  });
});

describe("assertIds", () => {
  it("lança com qualquer id inválido", () => {
    expect(() => assertIds("bbbbbbbb-0000-4000-8000-000000000001", "x")).toThrow("Registro inválido");
  });

  it("passa quando todos são válidos", () => {
    expect(assertIds("bbbbbbbb-0000-4000-8000-000000000001")).toBeUndefined();
  });
});
