import { describe, expect, it } from "vitest";

import { chunk, paginate, toPageSize, toCount } from "./search-params";

describe("toCount", () => {
  it("aceita inteiros dentro do limite", () => {
    expect(toCount("0")).toBe(0);
    expect(toCount("4")).toBe(4);
    expect(toCount("6")).toBe(6);
  });

  it("recusa vazio, ausente, decimal, negativo, texto e acima do limite", () => {
    for (const value of [undefined, "", "1.5", "-1", "abc", "7"]) expect(toCount(value)).toBeUndefined();
  });

  it("aceita limite personalizado", () => {
    expect(toCount("7", 10)).toBe(7);
  });
});

describe("paginação por URL", () => {
  it("tamanho: múltiplo de 50, com piso e teto", () => {
    expect(toPageSize(undefined)).toBe(50);
    expect(toPageSize("abc")).toBe(50);
    expect(toPageSize("0")).toBe(50);
    expect(toPageSize("100")).toBe(100);
    expect(toPageSize("101")).toBe(150);
    expect(toPageSize("99999")).toBe(1000);
  });

  it("usa a linha extra para saber se há mais", () => {
    const rows = Array.from({ length: 51 }, (_, i) => i);
    expect(paginate(rows, 50)).toEqual({ items: rows.slice(0, 50), nextSize: 100 });
    expect(paginate(rows.slice(0, 50), 50).nextSize).toBeNull();
    expect(paginate(Array.from({ length: 1001 }, (_, i) => i), 1000).nextSize).toBeNull();
  });

  it("divide em blocos", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});
