import { describe, expect, it } from "vitest";

import { encodeForUrl, formatCityState, guestsCsv, sanitizeSearch, whatsappUrl } from "./domain";

describe("guests domain", () => {
  it("monta link do WhatsApp com DDI do Brasil", () => {
    expect(whatsappUrl("(11) 98765-4321")).toBe("https://api.whatsapp.com/send?phone=5511987654321");
    expect(whatsappUrl("+55 11 98765-4321", "Olá")).toBe("https://api.whatsapp.com/send?phone=5511987654321&text=Ol%C3%A1");
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

describe("guestsCsv", () => {
  const guest = {
    id: "g1",
    owner_id: "o1",
    full_name: "=Ana Lima",
    document: "529.982.247-25",
    birth_date: "1990-05-20",
    phone: "(11) 98888-7777",
    email: null,
    city: "Campos do Jordão",
    state: "SP",
    notes: "Gosta de lenha; chega tarde",
    deleted_at: null,
    created_at: "2026-11-01T12:00:00Z",
    updated_at: "2026-11-01T12:00:00Z",
  };

  it("exporta o cadastro com datas brasileiras e texto seguro", () => {
    const [header, line] = guestsCsv([guest]).split("\r\n");
    expect(header?.startsWith("Nome;CPF/Documento")).toBe(true);
    expect(line).toBe(
      "'=Ana Lima;529.982.247-25;20/05/1990;(11) 98888-7777;;Campos do Jordão;SP;\"Gosta de lenha; chega tarde\";01/11/2026",
    );
  });
});

describe("encodeForUrl", () => {
  it("codifica emojis em UTF-8 e pontuação que corta o texto", () => {
    expect(encodeForUrl("Olá, Ana! ✅ 📅")).toBe("Ol%C3%A1%2C%20Ana%21%20%E2%9C%85%20%F0%9F%93%85");
    expect(encodeForUrl("(a) *b* 'c'")).toBe("%28a%29%20%2Ab%2A%20%27c%27");
  });

  it("não gera código inválido com emoji quebrado", () => {
    expect(encodeForUrl("a\ud83d")).toBe("a%EF%BF%BD");
  });

  it("mantém emojis no link de confirmação", () => {
    const url = whatsappUrl("11987654321", "Oi 📅") ?? "";
    expect(url.endsWith("text=Oi%20%F0%9F%93%85")).toBe(true);
  });
});
