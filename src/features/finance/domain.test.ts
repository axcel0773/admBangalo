import { describe, expect, it } from "vitest";

import {
  buildChaletBreakdown,
  compareWithPrevious,
  previousTrendPoint,
  buildMonthReport,
  buildTrend,
  endOfMonth,
  financeCsv,
  formatMonth,
  nightsInMonth,
  parseMonthParam,
  shiftMonth,
  type FinanceStay,
} from "./domain";

function stay(overrides: Partial<FinanceStay>): FinanceStay {
  return {
    reservation_id: "r1",
    chalet_name: "Bangalô Ipê",
    main_guest_name: "Maria Souza",
    check_in: "2026-11-10",
    check_out: "2026-11-13",
    nights: 3,
    guests_count: 2,
    status: "confirmed",
    lodging_total: 1050,
    charges_total: 234.5,
    energy_total: 84.5,
    cleaning_total: 150,
    grand_total: 1284.5,
    paid_total: 600,
    balance_due: 684.5,
    payment_status: "partial",
    ...overrides,
  };
}

describe("meses", () => {
  it("lê o mês da URL e cai no mês atual quando inválido", () => {
    expect(parseMonthParam("2026-07", "2026-11-03")).toBe("2026-07-01");
    expect(parseMonthParam("2026-13", "2026-11-03")).toBe("2026-11-01");
    expect(parseMonthParam(undefined, "2026-11-03")).toBe("2026-11-01");
  });

  it("anda entre meses atravessando o ano", () => {
    expect(shiftMonth("2026-11-01", 2)).toBe("2027-01-01");
    expect(shiftMonth("2026-01-01", -1)).toBe("2025-12-01");
    expect(endOfMonth("2028-02-01")).toBe("2028-02-29");
  });

  it("formata o mês por extenso", () => {
    expect(formatMonth("2026-11-01")).toBe("novembro de 2026");
  });

  it("conta só as noites dentro do mês", () => {
    expect(nightsInMonth({ check_in: "2026-10-30", check_out: "2026-11-02" }, "2026-11-01")).toBe(1);
    expect(nightsInMonth({ check_in: "2026-11-29", check_out: "2026-12-03" }, "2026-11-01")).toBe(2);
    expect(nightsInMonth({ check_in: "2026-12-01", check_out: "2026-12-03" }, "2026-11-01")).toBe(0);
  });
});

describe("relatório do mês", () => {
  const report = buildMonthReport({
    month: "2026-11-01",
    activeChalets: 2,
    stays: [
      stay({}),
      // começou em outubro: entra na ocupação, não na receita de novembro
      stay({ reservation_id: "r2", check_in: "2026-10-30", check_out: "2026-11-02", nights: 3, grand_total: 900 }),
      // cancelada: fica de fora de tudo
      stay({ reservation_id: "r3", status: "cancelled", check_in: "2026-11-20", check_out: "2026-11-22" }),
    ],
    payments: [
      { amount: 600, kind: "deposit", method: "pix", paid_at: "2026-11-01" },
      { amount: 200, kind: "balance", method: "cash", paid_at: "2026-11-05" },
      { amount: 50, kind: "refund", method: "pix", paid_at: "2026-11-06" },
    ],
  });

  it("soma receita por mês de check-in, sem canceladas", () => {
    expect(report.stays.map((s) => s.reservation_id)).toEqual(["r1"]);
    expect(report.expected).toBe(1284.5);
    expect(report.received).toBe(600);
    expect(report.pending).toBe(684.5);
    expect(report.energy).toBe(84.5);
    expect(report.cleaning).toBe(150);
    expect(report.otherCharges).toBe(0);
  });

  it("calcula ocupação com as noites dentro do mês", () => {
    expect(report.nightsSold).toBe(4);
    expect(report.occupancy).toBeGreaterThan(0.066);
    expect(Math.round(report.occupancy * 1000)).toBe(67); // 4 / (2 × 30)
  });

  it("caixa do mês desconta estornos e separa por forma", () => {
    expect(report.cashIn).toBe(750);
    expect(report.cashByMethod).toEqual({ pix: 550, cash: 200 });
  });

  it("saldo negativo (pago a mais) não reduz o a receber", () => {
    const overpaid = buildMonthReport({
      month: "2026-11-01",
      activeChalets: 1,
      stays: [stay({}), stay({ reservation_id: "r9", balance_due: -20 })],
      payments: [],
    });
    expect(overpaid.pending).toBe(684.5);
  });
});

describe("tendência e CSV", () => {
  it("preenche os 6 meses com zero onde não houve reserva", () => {
    const trend = buildTrend(
      [{ month: "2026-09-01", revenue_expected: 3000, revenue_received: 2500 }],
      "2026-11-01",
    );
    expect(trend.map((p) => p.month)).toEqual([
      "2026-06-01",
      "2026-07-01",
      "2026-08-01",
      "2026-09-01",
      "2026-10-01",
      "2026-11-01",
    ]);
    expect(trend[3]).toEqual({ month: "2026-09-01", label: "set", expected: 3000, received: 2500 });
    expect(trend[5]?.expected).toBe(0);
  });

  it("gera CSV com ponto e vírgula e vírgula decimal", () => {
    const csv = financeCsv({ stays: [stay({ main_guest_name: 'Ana "Nina"; Lima' })] });
    const [header, line] = csv.split("\r\n");
    expect(header?.startsWith("Check-in;Check-out;Noites")).toBe(true);
    expect(line).toBe('10/11/2026;13/11/2026;3;2;Bangalô Ipê;"Ana ""Nina""; Lima";1050,00;150,00;84,50;0,00;1284,50;600,00;684,50');
  });
});

describe("por bangalô", () => {
  const rows = buildChaletBreakdown({
    month: "2026-11-01",
    chalets: [
      { name: "Bangalô Ipê", color: "#4A6B3A" },
      { name: "Bangalô Jabuticaba", color: "#8B5A6B" },
    ],
    stays: [
      stay({}),
      stay({ reservation_id: "r2", check_in: "2026-10-30", check_out: "2026-11-02", nights: 3, grand_total: 900 }),
      stay({ reservation_id: "r3", status: "cancelled" }),
      stay({ reservation_id: "r4", chalet_name: "Bangalô Antigo", grand_total: 200 }),
    ],
  });

  it("soma receita pelo check-in e noites dentro do mês", () => {
    const ipe = rows.find((row) => row.name === "Bangalô Ipê");
    expect(ipe?.reservations).toBe(1);
    expect(ipe?.revenue).toBe(1284.5);
    expect(ipe?.nights).toBe(4); // 3 de r1 + a noite de 1º de novembro de r2
  });

  it("mostra bangalô parado com zero e ordena pela receita", () => {
    expect(rows.map((row) => row.name)).toEqual(["Bangalô Ipê", "Bangalô Antigo", "Bangalô Jabuticaba"]);
    expect(rows.at(-1)).toMatchObject({ revenue: 0, nights: 0, occupancy: 0 });
  });
});

describe("comparativo com o mês anterior", () => {
  it("alta, queda e igual, com variação percentual", () => {
    expect(compareWithPrevious(1200, 1000)).toEqual({ direction: "up", delta: 200, ratio: 0.2 });
    expect(compareWithPrevious(750, 1000)).toEqual({ direction: "down", delta: -250, ratio: 0.25 });
    expect(compareWithPrevious(1000, 1000)).toEqual({ direction: "same", delta: 0, ratio: 0 });
  });

  it("mês anterior zerado não tem percentual", () => {
    expect(compareWithPrevious(500, 0)).toEqual({ direction: "up", delta: 500, ratio: null });
  });

  it("arredonda centavos", () => {
    expect(compareWithPrevious(100.1 + 0.2, 100.3).direction).toBe("same");
  });

  it("pega o penúltimo ponto da tendência", () => {
    const points = [
      { month: "2026-10-01", label: "out", expected: 10, received: 5 },
      { month: "2026-11-01", label: "nov", expected: 20, received: 8 },
    ];
    expect(previousTrendPoint(points)?.label).toBe("out");
    expect(previousTrendPoint(points.slice(1))).toBeNull();
    expect(previousTrendPoint([])).toBeNull();
  });
});
