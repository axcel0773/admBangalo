import { describe, expect, it } from "vitest";

import { describePackage, packageNightsWarning, packagesForStay } from "./domain";

const packages = [
  { name: "Semana", nights: 7 },
  { name: "Feriado", nights: 4 },
  { name: "Fim de semana", nights: 3 },
  { name: "Carnaval", nights: 3 },
];

describe("pacotes", () => {
  it("mostra primeiro os pacotes com as mesmas noites da estadia", () => {
    expect(packagesForStay(packages, 3).map((pkg) => pkg.name)).toEqual(["Carnaval", "Fim de semana", "Feriado", "Semana"]);
    expect(packagesForStay(packages, 6).map((pkg) => pkg.name)).toEqual(["Semana", "Feriado", "Carnaval", "Fim de semana"]);
  });

  it("descreve noites e valor", () => {
    expect(describePackage({ nights: 3, total: 1000 }).replace(/ /g, " ")).toBe("3 noites · R$ 1.000,00");
  });

  it("avisa quando as noites não batem, sem bloquear", () => {
    expect(packageNightsWarning({ nights: 4 }, 3)).toBe("Este pacote é de 4 noites; a estadia tem 3 noites.");
    expect(packageNightsWarning({ nights: 3 }, 3)).toBeNull();
    expect(packageNightsWarning(null, 3)).toBeNull();
  });
});
