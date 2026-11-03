import { describe, expect, it } from "vitest";

import { formatCityState, sanitizeSearch, whatsappUrl } from "./domain";

describe("guests domain", () => {
  it("monta link do WhatsApp com DDI do Brasil", () => {
    expect(whatsappUrl("(11) 98765-4321")).toBe("https://wa.me/5511987654321");
    expect(whatsappUrl("+55 11 98765-4321", "Olá")).toBe("https://wa.me/5511987654321?text=Ol%C3%A1");
    expect(whatsappUrl("123")).toBe(null);
    expect(whatsappUrl(null)).toBe(null);
  });

  it("formata cidade e UF", () => {
    expect(formatCityState({ city: "Curitiba", state: "PR" })).toBe("Curitiba/PR");
    expect(formatCityState({ city: null, state: "PR" })).toBe("PR");
    expect(formatCityState({ city: null, state: null })).toBe(null);
  });

  it("limpa a busca para o filtro do PostgREST", () => {
    expect(sanitizeSearch(" maria,(souza)% ")).toBe("maria  souza");
  });
});
