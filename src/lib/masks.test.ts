import { describe, expect, it } from "vitest";

import {
  documentProblem,
  emailProblem,
  maskCpf,
  maskDocument,
  maskInteger,
  maskMoney,
  maskNumber,
  maskPhone,
  maskUf,
  moneyProblem,
  phoneProblem,
  ufProblem,
} from "./masks";
import { parseMoney } from "./money";

describe("máscaras", () => {
  it("telefone fixo e celular", () => {
    expect(maskPhone("11")).toBe("(11");
    expect(maskPhone("1134567890")).toBe("(11) 3456-7890");
    expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
    expect(maskPhone("(11) 98765-43219999")).toBe("(11) 98765-4321");
  });

  it("CPF enquanto digita", () => {
    expect(maskCpf("529")).toBe("529");
    expect(maskCpf("5299822")).toBe("529.982.2");
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
  });

  it("documento com letras (RG/passaporte) não vira CPF", () => {
    expect(maskDocument("ab123456")).toBe("AB123456");
    expect(maskDocument("52998224725")).toBe("529.982.247-25");
  });

  it("dinheiro: só números, uma vírgula e duas casas", () => {
    expect(maskMoney("R$ 350")).toBe("350");
    expect(maskMoney("350,5")).toBe("350,5");
    expect(maskMoney("350,567")).toBe("350,56");
    expect(maskMoney("1.234,56")).toBe("1234,56");
    expect(maskMoney("1.234")).toBe("1234");
    expect(maskMoney("12.5")).toBe("12,5");
    expect(maskMoney("abc")).toBe("");
    // o valor mascarado continua sendo lido pelo servidor
    expect(parseMoney(maskMoney("1.234,56"))).toBe(1234.56);
  });

  it("leitura do medidor com uma casa e inteiros", () => {
    expect(maskNumber("12345,67", 1)).toBe("12345,6");
    expect(maskInteger("3 noites")).toBe("3");
  });

  it("UF", () => {
    expect(maskUf("sp1")).toBe("SP");
    expect(maskUf("minas")).toBe("MI");
  });
});

describe("validações instantâneas", () => {
  it("telefone com DDD", () => {
    expect(phoneProblem("")).toBeNull();
    expect(phoneProblem("(11) 98765-4321")).toBeNull();
    expect(phoneProblem("98765-4321")).toMatch(/DDD/);
  });

  it("CPF com dígito verificador; outros documentos passam", () => {
    expect(documentProblem("529.982.247-25")).toBeNull();
    expect(documentProblem("529.982.247-26")).toMatch(/CPF inválido/);
    expect(documentProblem("MG-12.345.678")).toBeNull();
    expect(documentProblem("")).toBeNull();
  });

  it("e-mail e UF", () => {
    expect(emailProblem("maria@exemplo.com")).toBeNull();
    expect(emailProblem("maria@exemplo")).toMatch(/inválido/);
    expect(ufProblem("mg")).toBeNull();
    expect(ufProblem("XX")).toMatch(/UF inválida/);
  });

  it("valor obrigatório e positivo", () => {
    expect(moneyProblem("", { required: true })).toBe("Informe o valor");
    expect(moneyProblem("0", { positive: true })).toMatch(/maior que zero/);
    expect(moneyProblem("1.234,56", { required: true, positive: true })).toBeNull();
  });
});
