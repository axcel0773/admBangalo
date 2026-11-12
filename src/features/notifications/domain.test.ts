import { describe, expect, it } from "vitest";

import { buildDigest } from "./domain";

describe("aviso diário", () => {
  it("junta chegadas, saídas e cobranças", () => {
    const digest = buildDigest({ arrivals: 2, departures: 1, overdueCount: 1, overdueAmount: 500 });
    expect(digest?.title).toBe("Bangalôs · hoje");
    expect(digest?.body).toContain("2 chegadas");
    expect(digest?.body).toContain("1 saída");
    expect(digest?.body).toMatch(/1 cobrança vencida \(R\$\s500,00\)/);
  });

  it("omite o que é zero", () => {
    expect(buildDigest({ arrivals: 1, departures: 0, overdueCount: 0, overdueAmount: 0 })?.body).toBe("1 chegada");
  });

  it("sem nada a avisar, não manda nada", () => {
    expect(buildDigest({ arrivals: 0, departures: 0, overdueCount: 0, overdueAmount: 0 })).toBeNull();
  });
});
