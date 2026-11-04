import { describe, expect, it } from "vitest";

import { csvCell, csvDate, csvNumber, toCsv } from "./csv";

describe("csv", () => {
  it("escapa aspas, ponto e vírgula e quebras de linha", () => {
    expect(csvCell('Ana "Nina"; Lima')).toBe('"Ana ""Nina""; Lima"');
    expect(csvCell("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
  });

  it("neutraliza fórmulas (CSV injection)", () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(csvCell("+5511999")).toBe("'+5511999");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("mantém números negativos e vazios", () => {
    expect(csvCell(csvNumber(-50))).toBe("-50,00");
    expect(csvCell(null)).toBe("");
    expect(csvCell(3)).toBe("3");
  });

  it("monta linhas com ; e \\r\\n", () => {
    expect(toCsv(["A", "B"], [["1", csvDate("2026-11-10")]])).toBe("A;B\r\n1;10/11/2026");
  });
});
