import { describe, expect, it } from "vitest";

import { buildYearReport, parseYearParam, yearReportCsv, type ReportStay } from "./reports";

const stay = (over: Partial<ReportStay>): ReportStay => ({
  reservation_id: "r",
  chalet_name: "A",
  check_in: "2026-01-10",
  check_out: "2026-01-12",
  nights: 2,
  lodging_total: 1000,
  source: "direct",
  ...over,
});

describe("relatório anual", () => {
  it("ocupação e diária média do mês", () => {
    const report = buildYearReport({ year: 2026, stays: [stay({})], chaletNames: ["A", "B"] });
    const january = report.months[0]!;
    expect(january.nightsSold).toBe(2);
    expect(january.nightsAvailable).toBe(62); // 31 dias × 2 bangalôs
    expect(january.occupancy).toBeCloseTo(2 / 62);
    expect(january.averageRate).toBe(500);
    expect(report.months[1]!.nightsSold).toBe(0);
    expect(report.months[1]!.averageRate).toBe(0);
  });

  it("reparte a hospedagem entre os meses pelas noites", () => {
    const report = buildYearReport({
      year: 2026,
      stays: [stay({ check_in: "2026-01-30", check_out: "2026-02-03", nights: 4, lodging_total: 2000 })],
      chaletNames: ["A"],
    });
    expect(report.months[0]!.revenue).toBe(1000);
    expect(report.months[1]!.revenue).toBe(1000);
    expect(report.totals.revenue).toBe(2000);
  });

  it("agrupa por origem e por bangalô", () => {
    const report = buildYearReport({
      year: 2026,
      stays: [stay({}), stay({ source: "airbnb", chalet_name: "B", lodging_total: 500 }), stay({ source: "airbnb", chalet_name: "B", lodging_total: 300 })],
      chaletNames: ["A", "B"],
    });
    expect(report.sources.map((row) => [row.source, row.reservations])).toEqual([
      ["airbnb", 2],
      ["direct", 1],
    ]);
    expect(report.chalets[0]!.name).toBe("A");
    expect(report.chalets[1]!.nightsSold).toBe(4);
  });

  it("sem bangalôs não divide por zero", () => {
    const report = buildYearReport({ year: 2026, stays: [], chaletNames: [] });
    expect(report.totals.occupancy).toBe(0);
    expect(report.totals.averageRate).toBe(0);
  });

  it("valida o ano da URL e gera CSV com total", () => {
    expect(parseYearParam("2025", "2026-11-05")).toBe(2025);
    expect(parseYearParam("abc", "2026-11-05")).toBe(2026);
    expect(parseYearParam("1800", "2026-11-05")).toBe(2026);
    const csv = yearReportCsv(buildYearReport({ year: 2026, stays: [stay({})], chaletNames: ["A"] }));
    expect(csv.split("\r\n")).toHaveLength(14);
    expect(csv).toContain("Total;2;365;");
  });
});
