import { describe, expect, it } from "vitest";

import {
  buildCalendarGrid,
  buildDayAgenda,
  buildDays,
  buildMonthGrid,
  shiftCalendarMonth,
  occupiedChaletIds,
  toBlockSegment,
  toSegment,
  type CalendarBlock,
  type CalendarStay,
} from "./domain";

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

  it("mostra o chalé bloqueado quando não há hóspede", () => {
    const block: CalendarBlock = {
      id: "b1",
      chalet_id: "jabu",
      starts_on: "2026-11-05",
      ends_on: "2026-11-08",
      reason: "Pintura",
      source: "manual",
    };
    const agenda = buildDayAgenda(chalets, stays, "2026-11-06", [block]);
    expect(agenda.map((e) => [e.chalet.id, e.state, e.block?.reason])).toEqual([
      ["ipe", "leaving", undefined],
      ["jabu", "blocked", "Pintura"],
    ]);
    // hóspede na casa vence o bloqueio
    expect(buildDayAgenda(chalets, stays, "2026-11-04", [{ ...block, starts_on: "2026-11-04" }])[1]?.state).toBe("staying");
    expect(toBlockSegment(block, "2026-11-01", 5)).toEqual({ block, startIndex: 4, span: 1 });
    expect(toBlockSegment(block, "2026-11-10", 5)).toBeNull();
    const grid = buildCalendarGrid({ chalets, stays, blocks: [block], start: "2026-11-01", days: 14, today: "2026-11-03" });
    expect(grid.rows.find((row) => row.chalet.id === "jabu")?.blocks).toEqual([{ block, startIndex: 4, span: 3 }]);
  });

  it("lista chalés ocupados na noite", () => {
    expect(occupiedChaletIds(stays, "2026-11-03")).toEqual(["ipe", "jabu"]);
  });
});

describe("seletor de data", () => {
  it("monta as semanas do mês começando no domingo", () => {
    const grid = buildMonthGrid("2026-11-01", "2026-11-03", "2026-11-20");
    // novembro/2026 começa num domingo e tem 30 dias: 5 semanas
    expect(grid).toHaveLength(5);
    expect(grid[0]?.[0]).toMatchObject({ date: "2026-11-01", inMonth: true });
    expect(grid[0]?.[2]).toMatchObject({ date: "2026-11-03", isToday: true });
    expect(grid[2]?.[5]).toMatchObject({ date: "2026-11-20", isSelected: true });
    expect(grid[4]?.[6]).toMatchObject({ date: "2026-12-05", inMonth: false });
  });

  it("completa com dias do mês anterior", () => {
    const grid = buildMonthGrid("2026-12-01", "2026-11-03", null);
    expect(grid[0]?.[0]).toMatchObject({ date: "2026-11-29", inMonth: false });
    expect(grid[0]?.[2]).toMatchObject({ date: "2026-12-01", inMonth: true });
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });

  it("anda entre meses atravessando o ano", () => {
    expect(shiftCalendarMonth("2026-12-15", 1)).toBe("2027-01-01");
    expect(shiftCalendarMonth("2026-01-31", -1)).toBe("2025-12-01");
  });
});
