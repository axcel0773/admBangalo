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

import { completionFor, foldText, matchPages, type SearchPage } from "./domain";

const PAGES: SearchPage[] = [
  { label: "Hóspedes", description: "", href: "/hospedes", keywords: ["clientes"] },
  { label: "Reservas", description: "", href: "/reservas" },
  { label: "Orçamentos", description: "", href: "/orcamentos" },
];

describe("páginas na busca", () => {
  it("ignora acento e maiúsculas", () => {
    expect(foldText("Orçamentos")).toBe("orcamentos");
    expect(matchPages(PAGES, "HOS").map((page) => page.href)).toEqual(["/hospedes"]);
    expect(matchPages(PAGES, "orc").map((page) => page.href)).toEqual(["/orcamentos"]);
  });

  it("acha por palavra-chave e exige 2 letras", () => {
    expect(matchPages(PAGES, "cli").map((page) => page.href)).toEqual(["/hospedes"]);
    expect(matchPages(PAGES, "h")).toEqual([]);
  });

  it("completa só pelo começo do nome", () => {
    expect(completionFor(PAGES, "ho")).toBe("Hóspedes");
    expect(completionFor(PAGES, "res")).toBe("Reservas");
    expect(completionFor(PAGES, "spedes")).toBeNull();
    expect(completionFor(PAGES, "Hóspedes")).toBeNull();
    expect(completionFor(PAGES, " ho")).toBeNull();
    expect(completionFor(PAGES, "h")).toBeNull();
  });
});
