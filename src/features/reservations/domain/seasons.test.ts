import { describe, expect, it } from "vitest";

import { nightlyBreakdown, parseDateRange, toDateRange, type SeasonRate } from "./seasons";

describe("tarifas por temporada", () => {
  const reveillon: SeasonRate = {
    id: "s1",
    chalet_id: "c1",
    label: "Réveillon",
    start: "2026-12-30",
    end: "2027-01-02",
    nightly_rate: 600,
    min_nights: 3,
  };

  it("lê e grava o daterange do Postgres", () => {
    expect(parseDateRange("[2026-12-30,2027-01-02)")).toEqual({ start: "2026-12-30", end: "2027-01-02" });
    expect(parseDateRange("[2026-12-30,2027-01-01]")).toEqual({ start: "2026-12-30", end: "2027-01-02" });
    expect(parseDateRange("vazio")).toBeNull();
    expect(toDateRange("2026-12-30", "2027-01-01")).toBe("[2026-12-30,2027-01-02)");
  });

  it("cobra cada noite pela temporada em que cai", () => {
    const result = nightlyBreakdown({ checkIn: "2026-12-28", checkOut: "2027-01-03", baseRate: 350, seasons: [reveillon] });
    expect(result?.groups).toEqual([
      { label: null, nights: 2, rate: 350 },
      { label: "Réveillon", nights: 3, rate: 600 },
      { label: null, nights: 1, rate: 350 },
    ]);
    expect(result?.total).toBe(2850);
    expect(result?.average).toBe(475);
    expect(result?.minNightsIssue).toBeNull();
    expect(result?.seasonal).toBe(true);
  });

  it("avisa quando a estadia não atinge o mínimo da temporada", () => {
    const result = nightlyBreakdown({ checkIn: "2026-12-31", checkOut: "2027-01-02", baseRate: 350, seasons: [reveillon] });
    expect(result?.minNightsIssue).toEqual({ label: "Réveillon", minNights: 3 });
  });

  it("fora de temporada usa a diária base", () => {
    const result = nightlyBreakdown({ checkIn: "2026-11-10", checkOut: "2026-11-12", baseRate: 350, seasons: [reveillon] });
    expect(result).toEqual({
      total: 700,
      average: 350,
      groups: [{ label: null, nights: 2, rate: 350 }],
      minNightsIssue: null,
      seasonal: false,
    });
  });
});
