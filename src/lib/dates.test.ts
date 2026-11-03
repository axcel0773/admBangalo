import { describe, expect, it } from "vitest";

import { addDays, daysBetween, daysInMonth, formatStayRange, greetingFor, todayIso } from "./dates";

describe("dates", () => {
  it("usa o fuso de São Paulo para o dia de hoje", () => {
    // 02:00 UTC de 4/11 ainda é 3/11 em São Paulo (UTC-3).
    expect(todayIso(new Date("2026-11-04T02:00:00Z"))).toBe("2026-11-03");
  });

  it("conta noites entre check-in e check-out", () => {
    expect(daysBetween("2026-11-03", "2026-11-06")).toBe(3);
  });

  it("soma dias atravessando o mês", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });

  it("sabe quantos dias tem o mês", () => {
    expect(daysInMonth("2026-11-15")).toBe(30);
    expect(daysInMonth("2028-02-01")).toBe(29);
  });

  it("formata período curto no mesmo mês", () => {
    expect(formatStayRange("2026-11-03", "2026-11-06")).toBe("3–6 nov.");
  });

  it("cumprimenta pela hora local", () => {
    expect(greetingFor(new Date("2026-11-03T12:00:00Z"))).toBe("Bom dia"); // 09:00 em SP
    expect(greetingFor(new Date("2026-11-03T22:00:00Z"))).toBe("Boa noite"); // 19:00 em SP
  });
});
