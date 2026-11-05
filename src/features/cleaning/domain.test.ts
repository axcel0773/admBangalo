import { describe, expect, it } from "vitest";

import { buildCleaningTasks, cleaningMessage, cleaningUrgency, type CleaningStay } from "./domain";

const stay = (id: string, chaletId: string, checkIn: string, checkOut: string): CleaningStay => ({
  reservationId: id,
  chaletId,
  chaletName: `Bangalô ${chaletId}`,
  guestName: "Maria",
  checkIn,
  checkOut,
});

const today = "2026-11-10";

describe("limpeza", () => {
  const stays = [
    stay("a", "1", "2026-11-05", "2026-11-10"),
    stay("b", "1", "2026-11-10", "2026-11-12"),
    stay("c", "2", "2026-11-01", "2026-11-04"), // fora da janela (6 dias atrás)
    stay("d", "2", "2026-11-08", "2026-11-09"),
  ];

  it("gera uma limpeza por saída dentro da janela e acha a próxima entrada", () => {
    const tasks = buildCleaningTasks(stays, new Set(), today);
    expect(tasks.map((task) => task.reservationId)).toEqual(["d", "a", "b"]);
    expect(tasks.find((task) => task.reservationId === "a")?.nextCheckIn).toBe("2026-11-10");
    expect(tasks.find((task) => task.reservationId === "b")?.nextCheckIn).toBeNull();
  });

  it("feitas vão para o fim", () => {
    const tasks = buildCleaningTasks(stays, new Set(["d"]), today);
    expect(tasks.map((task) => task.reservationId)).toEqual(["a", "b", "d"]);
    expect(tasks[2]?.done).toBe(true);
  });

  it("classifica a urgência", () => {
    const tasks = buildCleaningTasks(stays, new Set(), today);
    const by = (id: string) => cleaningUrgency(tasks.find((task) => task.reservationId === id)!, today);
    expect(by("d")).toBe("late");
    expect(by("a")).toBe("same_day");
    expect(by("b")).toBe("upcoming");
  });

  it("mensagem avisa quando entra outro hóspede no mesmo dia", () => {
    const task = buildCleaningTasks(stays, new Set(), today).find((item) => item.reservationId === "a")!;
    expect(cleaningMessage(task)).toContain("mesmo dia");
    expect(cleaningMessage(task)).toContain("Bangalô 1");
  });
});
