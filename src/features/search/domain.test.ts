import { describe, expect, it } from "vitest";

import { normalizeSearchTerm, searchTotal } from "./domain";

describe("busca global", () => {
  it("normaliza o termo e rejeita buscas curtas", () => {
    expect(normalizeSearchTerm("  Maria   Souza ")).toBe("Maria Souza");
    expect(normalizeSearchTerm("a")).toBeNull();
    expect(normalizeSearchTerm(undefined)).toBeNull();
    expect(normalizeSearchTerm("x".repeat(100))).toHaveLength(60);
  });

  it("soma os resultados", () => {
    expect(searchTotal({ term: "ma", guests: [{ id: "1", name: "A", phone: null }], reservations: [], quotes: [] })).toBe(1);
  });
});
