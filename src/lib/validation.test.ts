import { describe, expect, it } from "vitest";

import { checkbox, document, isValidCpf, money, optionalText, phone } from "./validation";

describe("money", () => {
  const schema = money("Valor");

  it.each([
    ["350", 350],
    ["1.234,56", 1234.56],
    ["1234.56", 1234.56],
    ["0,95", 0.95],
    ["R$ 150,00", 150],
  ] as const)("converte %s", (raw, expected) => {
    expect(schema.parse(raw)).toBe(expected);
  });

  it("recusa vazio e negativo", () => {
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse("-10").success).toBe(false);
    expect(schema.safeParse("abc").success).toBe(false);
  });
});

describe("cpf e documento", () => {
  it("valida dígitos verificadores", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("123.456.789-00")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("aceita RG/passaporte e vazio", () => {
    expect(document.parse("MG-12.345.678")).toBe("MG-12.345.678");
    expect(document.parse("")).toBe(null);
    expect(document.safeParse("123.456.789-00").success).toBe(false);
  });
});

describe("phone", () => {
  it("exige DDD", () => {
    expect(phone.parse("(11) 98765-4321")).toBe("(11) 98765-4321");
    expect(phone.safeParse("98765-4321").success).toBe(false);
    expect(phone.parse(undefined)).toBe(null);
  });
});

describe("checkbox e texto opcional", () => {
  it("converte checkbox do FormData", () => {
    expect(checkbox.parse("on")).toBe(true);
    expect(checkbox.parse(undefined)).toBe(false);
  });

  it("string vazia vira null", () => {
    expect(optionalText().parse("  ")).toBe(null);
    expect(optionalText().parse(" ok ")).toBe("ok");
  });
});
