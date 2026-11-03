import { describe, expect, it } from "vitest";

import { buildCalendarGrid, buildDayAgenda, buildDays, occupiedChaletIds, toSegment, type CalendarStay } from "./domain";

const chalets = [
  { id: "ipe", name: "Chalé Ipê", color: "#4A6B3A", max_guests: 4 },
  { id: "jabu", name: "Chalé Jabuticaba", color: "#8B5A6B", max_guests: 2 },
];

const stay = (overrides: Partial<CalendarStay>): CalendarStay => ({
  reservation_id: "r1",
  chalet_id: "ipe",
  main_guest_name: "Maria Souza",
  check_in: "2026-11-03",
  check_out: "2026-11-06",
  guests_count: 3,
  status: "confirmed",
  payment_status: "partial",
  balance_due: 780,
  ...overrides,
});

describe("buildDays", () => {
  it("rotula dias e fins de semana", () => {
    const days = buildDays("2026-11-06", 3, "2026-11-07");
    expect(days.map((d) => [d.weekday, d.dayNumber, d.isWeekend, d.isToday])).toEqual([
      ["sex", 6, false, false],
      ["sáb", 7, true, true],
      ["dom", 8, true, false],
    ]);
  });
});

describe("toSegment", () => {
  it("ocupa só as noites (check-out não conta)", () => {
    expect(toSegment(stay({}), "2026-11-02", 14)).toMatchObject({ startIndex: 1, span: 3 });
  });

  it("corta estadias que começam antes ou terminam depois do período", () => {
    expect(toSegment(stay({ check_in: "2026-10-30", check_out: "2026-11-04" }), "2026-11-02", 7)).toMatchObject({
      startIndex: 0,
      span: 2,
      continuesFromBefore: true,
      continuesAfter: false,
    });
    expect(toSegment(stay({ check_in: "2026-11-07", check_out: "2026-11-12" }), "2026-11-02", 7)).toMatchObject({
      startIndex: 5,
      span: 2,
      continuesAfter: true,
    });
  });

  it("ignora estadias fora do período", () => {
    expect(toSegment(stay({ check_in: "2026-10-20", check_out: "2026-11-02" }), "2026-11-02", 7)).toBe(null);
  });
});

describe("buildCalendarGrid", () => {
  it("monta linhas por chalé e soma a ocupação, sem canceladas", () => {
    const grid = buildCalendarGrid({
      chalets,
      stays: [stay({}), stay({ reservation_id: "r2", status: "cancelled", check_in: "2026-11-07", check_out: "2026-11-09" })],
      start: "2026-11-02",
      days: 14,
      today: "2026-11-03",
    });
    expect(grid.rows.map((row) => [row.chalet.id, row.segments.length])).toEqual([
      ["ipe", 1],
      ["jabu", 0],
    ]);
    expect(grid.occupiedNights).toBe(3);
    expect(grid.totalNights).toBe(28);
  });
});

describe("buildDayAgenda", () => {
  const stays = [
    stay({}),
    stay({ reservation_id: "r2", chalet_id: "jabu", main_guest_name: "Paulo", check_in: "2026-10-31", check_out: "2026-11-03" }),
    stay({ reservation_id: "r3", chalet_id: "jabu", main_guest_name: "Bruno", check_in: "2026-11-03", check_out: "2026-11-05" }),
  ];

  it("identifica chegada, troca de hóspedes e estadia em curso", () => {
    expect(buildDayAgenda(chalets, stays, "2026-11-03").map((e) => [e.chalet.id, e.state, e.stay?.main_guest_name, e.leavingStay?.main_guest_name])).toEqual([
      ["ipe", "arriving", "Maria Souza", undefined],
      ["jabu", "turnover", "Bruno", "Paulo"],
    ]);
    expect(buildDayAgenda(chalets, stays, "2026-11-04").map((e) => e.state)).toEqual(["staying", "staying"]);
    expect(buildDayAgenda(chalets, stays, "2026-11-06").map((e) => e.state)).toEqual(["leaving", "free"]);
  });

  it("lista chalés ocupados na noite", () => {
    expect(occupiedChaletIds(stays, "2026-11-03")).toEqual(["ipe", "jabu"]);
  });
});
