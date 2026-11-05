import { describe, expect, it } from "vitest";

import { buildDashboard, nightsInMonth, occupiesNight } from "./build-dashboard";
import type { ChaletRow, StayRow } from "./types";

const TODAY = "2026-11-03";

const chalet = (id: string, name: string): ChaletRow => ({
  id,
  name,
  color: "#4A6B3A",
  max_guests: 4,
  base_nightly_rate: 350,
  check_in_time: "14:00:00",
  check_out_time: "12:00:00",
  photo_path: null,
});

const stay = (overrides: Partial<StayRow>): StayRow => ({
  reservation_id: "r1",
  chalet_id: "c1",
  chalet_name: "Ipê",
  main_guest_name: "Maria Souza",
  check_in: TODAY,
  check_out: "2026-11-06",
  nights: 3,
  guests_count: 3,
  status: "confirmed",
  grand_total: 1460.28,
  paid_total: 600,
  balance_due: 860.28,
  payment_status: "partial",
  ...overrides,
});

const chalets = [chalet("c1", "Ipê"), chalet("c2", "Jabuticaba")];
const arriving = stay({});
const leaving = stay({
  reservation_id: "r2",
  chalet_id: "c2",
  chalet_name: "Jabuticaba",
  main_guest_name: "Paulo Lima",
  check_in: "2026-10-31",
  check_out: TODAY,
  guests_count: 2,
  balance_due: 0,
  payment_status: "paid",
});

const data = buildDashboard({
  guestCount: 12,
  today: TODAY,
  chalets,
  monthStays: [arriving, leaving],
  openBalances: [arriving],
  monthPayments: [
    { amount: 600, kind: "deposit", method: "pix" },
    { amount: 420, kind: "balance", method: "cash" },
    { amount: 20, kind: "refund", method: "pix" },
  ],
  upcoming: [],
});

describe("occupiesNight", () => {
  it("não conta o dia do check-out", () => {
    expect(occupiesNight(leaving, TODAY)).toBe(false);
    expect(occupiesNight(arriving, TODAY)).toBe(true);
  });
});

describe("nightsInMonth", () => {
  it("corta a estadia que começou no mês anterior", () => {
    // 31/10 → 03/11: só as noites de 1 e 2 de novembro contam.
    expect(nightsInMonth([leaving], TODAY).get("c2")).toBe(2);
  });
});

describe("buildDashboard", () => {
  it("repassa o total de hóspedes e usa zero quando não informado", () => {
    expect(data.guestCount).toBe(12);
    expect(buildDashboard({ today: TODAY, chalets, monthStays: [], openBalances: [], monthPayments: [], upcoming: [] }).guestCount).toBe(0);
  });

  it("ordena a agenda pelo horário: saída 12h antes da chegada 14h", () => {
    expect(data.agenda.map((e) => [e.type, e.time, e.guestName])).toEqual([
      ["check-out", "12:00", "Paulo Lima"],
      ["check-in", "14:00", "Maria Souza"],
    ]);
  });

  it("define o status do dia de cada bangalô", () => {
    expect(data.chalets.map((c) => [c.name, c.status])).toEqual([
      ["Ipê", "arriving"],
      ["Jabuticaba", "leaving"],
    ]);
  });

  it("calcula ocupação do mês sobre todas as noites disponíveis", () => {
    // 3 (Ipê) + 2 (Jabuticaba) noites de 60 possíveis.
    expect(data.summary.nightsSold).toBe(5);
    expect(data.summary.nightsAvailable).toBe(60);
  });

  it("soma recebidos pela data do pagamento, descontando estornos", () => {
    expect(data.summary.receivedThisMonth).toBe(1000);
    expect(data.summary.paymentsThisMonth).toBe(2);
    expect(data.summary.pixPaymentsThisMonth).toBe(1);
  });

  it("marca saldo que vence hoje", () => {
    expect(data.summary.receivableTotal).toBe(860.28);
    expect(data.summary.dueNowCount).toBe(1);
    expect(data.receivables[0]?.dueStatus).toBe("today");
  });

  it("marca como vencido o saldo de check-in passado", () => {
    const late = buildDashboard({
      today: TODAY,
      chalets,
      monthStays: [],
      openBalances: [stay({ check_in: "2026-11-01" })],
      monthPayments: [],
      upcoming: [],
    });
    expect(late.receivables[0]?.dueStatus).toBe("overdue");
    expect(late.summary.dueNowCount).toBe(1);
  });

  it("usa o vencimento da próxima parcela em aberto", () => {
    const open = stay({ check_in: "2026-12-20" });
    const withSchedule = buildDashboard({
      today: TODAY,
      chalets,
      monthStays: [],
      openBalances: [open],
      monthPayments: [],
      upcoming: [],
      schedules: new Map([
        [
          open.reservation_id,
          [
            // pago 600: o sinal de 800 ficou com 200 em aberto e venceu dia 1º
            { id: "p1", description: "Sinal", amount: 800, due_date: "2026-11-01" },
            { id: "p2", description: "Saldo", amount: 660.28, due_date: "2026-12-20" },
          ],
        ],
      ]),
    });
    expect(withSchedule.receivables[0]?.dueDate).toBe("2026-11-01");
    expect(withSchedule.receivables[0]?.dueStatus).toBe("overdue");
  });

  it("conta hóspedes que dormem hoje", () => {
    expect(data.summary.guestsToday).toBe(3);
  });
});
