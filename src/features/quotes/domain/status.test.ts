import { describe, expect, it } from "vitest";

import { displayStatus, filterQuotes, isOpenQuote, isQuoteFilter, isQuoteStatus, overlapsAnyStay } from "./status";

const TODAY = "2026-11-05";
const quote = (status: "draft" | "sent" | "accepted" | "declined", valid_until: string) => ({ status, valid_until });

describe("situação do orçamento", () => {
  it("vencido só vale para rascunho ou enviado fora da validade", () => {
    expect(displayStatus(quote("sent", "2026-11-04"), TODAY)).toBe("expired");
    expect(displayStatus(quote("draft", "2026-11-04"), TODAY)).toBe("expired");
    expect(displayStatus(quote("sent", TODAY), TODAY)).toBe("sent");
    expect(displayStatus(quote("accepted", "2026-10-01"), TODAY)).toBe("accepted");
    expect(displayStatus(quote("declined", "2026-10-01"), TODAY)).toBe("declined");
  });

  it("filtra a lista", () => {
    const list = [
      quote("draft", "2026-11-10"),
      quote("sent", "2026-11-01"),
      quote("accepted", "2026-11-10"),
      quote("declined", "2026-11-10"),
    ];
    expect(filterQuotes(list, "all", TODAY)).toHaveLength(4);
    expect(filterQuotes(list, "open", TODAY)).toEqual([list[0]]);
    expect(filterQuotes(list, "expired", TODAY)).toEqual([list[1]]);
    expect(filterQuotes(list, "accepted", TODAY)).toEqual([list[2]]);
    expect(filterQuotes(list, "declined", TODAY)).toEqual([list[3]]);
  });

  it("só orçamento em aberto pode perder as datas", () => {
    expect(isOpenQuote(quote("sent", TODAY), TODAY)).toBe(true);
    expect(isOpenQuote(quote("accepted", TODAY), TODAY)).toBe(false);
    expect(isOpenQuote(quote("sent", "2026-11-01"), TODAY)).toBe(false);
  });

  it("valida parâmetros", () => {
    expect(isQuoteStatus("sent")).toBe(true);
    expect(isQuoteStatus("expired")).toBe(false);
    expect(isQuoteStatus("toString")).toBe(false);
    expect(isQuoteFilter("open")).toBe(true);
    expect(isQuoteFilter("x")).toBe(false);
    expect(isQuoteFilter(undefined)).toBe(false);
  });
});

describe("datas ocupadas", () => {
  const q = { chalet_id: "c1", check_in: "2026-12-10", check_out: "2026-12-13" };

  it("sobreposição no mesmo bangalô", () => {
    expect(overlapsAnyStay(q, [{ chalet_id: "c1", check_in: "2026-12-12", check_out: "2026-12-15" }])).toBe(true);
    expect(overlapsAnyStay(q, [{ chalet_id: "c1", check_in: "2026-12-01", check_out: "2026-12-11" }])).toBe(true);
  });

  it("check-out no dia do check-in (e vice-versa) não conflita", () => {
    expect(overlapsAnyStay(q, [{ chalet_id: "c1", check_in: "2026-12-07", check_out: "2026-12-10" }])).toBe(false);
    expect(overlapsAnyStay(q, [{ chalet_id: "c1", check_in: "2026-12-13", check_out: "2026-12-15" }])).toBe(false);
  });

  it("outro bangalô não conflita", () => {
    expect(overlapsAnyStay(q, [{ chalet_id: "c2", check_in: "2026-12-10", check_out: "2026-12-13" }])).toBe(false);
    expect(overlapsAnyStay(q, [])).toBe(false);
  });
});
